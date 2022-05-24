// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ConfirmPrompt, DialogSet, DialogTurnStatus, OAuthPrompt, WaterfallDialog, ChoicePrompt, ChoiceFactory, TextPrompt } = require('botbuilder-dialogs');

const { LogoutDialog } = require('./logoutDialog');

const {EventFactory} = require('botbuilder');

const CONFIRM_PROMPT = 'ConfirmPrompt';
const MAIN_DIALOG = 'MainDialog';
const MAIN_WATERFALL_DIALOG = 'MainWaterfallDialog';
const OAUTH_PROMPT = 'OAuthPrompt';

const CHOICE_PROMPT = 'ChoiceDialog';
const TEXT_PROMPT = 'TextPrompt';

class MainDialog extends LogoutDialog {
    constructor() {
        super(MAIN_DIALOG, process.env.connectionName);

        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new OAuthPrompt(OAUTH_PROMPT, {
            connectionName: process.env.connectionName,
            text: 'Please Sign In',
            title: 'Sign In',
            timeout: 300000, // Number of milliseconds the prompt waits for user to authenticate
            showSignInLink: true
        }));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
            this.optionStep.bind(this),
            this.optionInputStep.bind(this),
            // this.promptStep.bind(this),
            this.loginValidationStep.bind(this),
            this.orderHistoryStep.bind(this),
            this.promptAdditionalHelpStep.bind(this),
            this.transferToAgentStep.bind(this)
            // this.displayTokenPhase1.bind(this),
            // this.displayTokenPhase2.bind(this)
        ]));

        this.initialDialogId = MAIN_WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a DialogContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} dialogContext
     */
    async run(context, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(context);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    async optionStep(stepContext) {
        console.log('[optionStep]');
        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt: 'Hello, I am your Virtual Assistant. How can I help you?',
            choices: ChoiceFactory.toChoices(['Sales', 'Order History', 'Technical Support'])
        });
    }

    async optionInputStep(stepContext) {
        console.log('[optionInputStep]');
        const optionResponse = stepContext.result;
        if (optionResponse.value === 'Sales') {
            const handoffContext = {
                context: {
                    BotHandoffTopic: 'Sales'
                },
                messageToAgent: 'Issue Summary: Sales'
            };

            const handoffEvent = EventFactory.createHandoffInitiation(stepContext.context, handoffContext);

            await stepContext.context.sendActivity({
                text: 'Transferring to agent...'
            });

            await stepContext.context.sendActivity(handoffEvent);
        } else if (optionResponse.value === 'Order History') {
            console.log('[Order History]');
            // return await stepContext.endDialog();
            await stepContext.context.sendActivity("Got it! To access your order history, I'll need you to verify your account.");
            return await stepContext.beginDialog(OAUTH_PROMPT);
        } else if (optionResponse.value === 'Technical Support') {

        }

        return await stepContext.endDialog();
    }

    async orderHistoryStep(stepContext) {
        console.log('[orderHistoryStep]');
        await stepContext.context.sendActivity('Last Order: Apr 20 2020, Coffee Machine, $149.99');
        return await stepContext.continueDialog();
    }

    async promptAdditionalHelpStep(stepContext) {
        console.log('[promptAdditionalHelpStep]');
        return await stepContext.prompt(TEXT_PROMPT, 'Is there anything else I can help you with?');
    }

    async transferToAgentStep(stepContext) {
        console.log('[transferToAgentStep]');
        const handoffContext = {
            context: {
                BotHandoffTopic: 'Order History'
            },
            messageToAgent: 'Issue Summary: Speak with Sales rep'
        };

        const handoffEvent = EventFactory.createHandoffInitiation(stepContext.context, handoffContext);

        await stepContext.context.sendActivity({
            text: 'Sure, let me transfer you now...'
        });

        await stepContext.context.sendActivity(handoffEvent);

        return await stepContext.endDialog();
    }

    async promptStep(stepContext) {
        console.log('[promptStep]');
        await stepContext.context.sendActivity('Thank you for verifiying your account. Pulling up your information now...');
        return await stepContext.beginDialog(OAUTH_PROMPT);
    }

    async loginValidationStep(stepContext) {
        console.log('[loginValidationStep]');
        // console.log(stepContext);
        // Get the token from the previous step. Note that we could also have gotten the
        // token directly from the prompt itself. There is an example of this in the next method.
        const tokenResponse = stepContext.result;
        // await stepContext.context.sendActivity('Thank you for verifiying your account. Pulling up your information now...');
        if (tokenResponse && tokenResponse.token) {
            await stepContext.context.sendActivity('Thank you for verifiying your account. Pulling up your information now...');
            // await stepContext.context.sendActivity('You are now logged in.');
            // return await stepContext.endDialog();
        } else {
            await stepContext.context.sendActivity('Login was not successful please try again.');
            return await stepContext.beginDialog(OAUTH_PROMPT);
        }

        return await stepContext.continueDialog();
    }

    async loginStep(stepContext) {
        console.log('[loginStep]');
        // Get the token from the previous step. Note that we could also have gotten the
        // token directly from the prompt itself. There is an example of this in the next method.
        const tokenResponse = stepContext.result;
        if (tokenResponse) {
            await stepContext.context.sendActivity('You are now logged in.');
            return await stepContext.prompt(CONFIRM_PROMPT, 'Would you like to view your token?');
        }
        await stepContext.context.sendActivity('Login was not successful please try again.');
        return await stepContext.endDialog();
    }

    async displayTokenPhase1(stepContext) {
        console.log('[displayTokenPhase1]');

        await stepContext.context.sendActivity('Thank you.');

        const result = stepContext.result;
        if (result) {
            // Call the prompt again because we need the token. The reasons for this are:
            // 1. If the user is already logged in we do not need to store the token locally in the bot and worry
            // about refreshing it. We can always just call the prompt again to get the token.
            // 2. We never know how long it will take a user to respond. By the time the
            // user responds the token may have expired. The user would then be prompted to login again.
            //
            // There is no reason to store the token locally in the bot because we can always just call
            // the OAuth prompt to get the token or get a new token if needed.
            return await stepContext.beginDialog(OAUTH_PROMPT);
        }
        return await stepContext.endDialog();
    }

    async displayTokenPhase2(stepContext) {
        console.log('[displayTokenPhase2]');

        const tokenResponse = stepContext.result;
        if (tokenResponse) {
            await stepContext.context.sendActivity(`Here is your token ${ tokenResponse.token }`);
        }
        return await stepContext.endDialog();
    }
}

module.exports.MainDialog = MainDialog;
