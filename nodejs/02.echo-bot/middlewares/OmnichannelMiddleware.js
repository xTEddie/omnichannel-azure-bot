const DeliveryMode = 'deliveryMode';
const Bridged = 'bridged';
const Tags = 'tags'

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
            }

            // console.log(activities);
            return await nextSend();
        });

        await next();
    }
}

module.exports.OmnichannelMiddleware = OmnichannelMiddleware;
