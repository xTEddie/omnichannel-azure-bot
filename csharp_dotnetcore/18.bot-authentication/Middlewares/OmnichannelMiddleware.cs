using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using System;
using Newtonsoft.Json;

namespace Microsoft.BotBuilderSamples.Middlewares
{
    public class OmnichannelMiddleware : IMiddleware
    {
        private const string DeliveryMode = "deliveryMode";
        private const string Bridged = "bridged";

        public OmnichannelMiddleware()
        {
            // Console.WriteLine("[OmnichannelMiddleware]");
        }

        public async Task OnTurnAsync(ITurnContext turnContext, NextDelegate next, CancellationToken cancellationToken = default(CancellationToken))
        {
            turnContext.OnSendActivities((newContext, activities, nextSend) =>
            {
                Console.WriteLine("[OmnichannelMiddleware][OnSendActivities]");
                foreach (var activity in activities.Where(a => a.Type == ActivityTypes.Message))
                {
                    Console.WriteLine(activity);

                    if (activity.ChannelData != null)
                    {
                        (activity as IActivity).ChannelData[DeliveryMode] = Bridged;
                    }
                    else
                    {
                        activity.ChannelData = new Dictionary<string, object>() { { DeliveryMode, Bridged } };
                    }

                    // Console.WriteLine(JsonConvert.SerializeObject(activity.ChannelData, Formatting.Indented));
                }
                return nextSend();
            });

            await next(cancellationToken).ConfigureAwait(false);
        }
    }
}