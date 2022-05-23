const DeliveryMode = 'deliveryMode';
const Bridged = 'bridged';
const Tags = 'tags';

class OmnichannelMiddleware {
    async onTurn(context, next) {
        await context.onSendActivities(async (context, activities, nextSend) => {
            for (const activity of activities) {
                if (activity.type === 'message') {
                    if (!activity.channelData) {
                        activity.channelData = {};
                    }

                    if (!Object.keys(activity.channelData).includes(DeliveryMode)) {
                        activity.channelData[DeliveryMode] = Bridged;
                    }
                }

                if (activity.type === 'event') {
                    if (activity.name === 'handoff.initiate') {
                        const handoffContext = activity.value;
                        activity.type = 'message';
                        activity.text = handoffContext.messageToAgent || 'Issue Summary: NA';
                        const command = {
                            type: 0,
                            context: handoffContext.context
                        };

                        activity.channelData = {
                            tags: JSON.stringify(command)
                        };

                        activity.value = null;
                    }
                }
            }

            // console.log(activities);
            return await nextSend();
        });

        await next();
    }
}

module.exports.OmnichannelMiddleware = OmnichannelMiddleware;
