// import { HandlerApolloServerOptions } from "@webiny/handler-graphql/types";

// We can rely on the default "handler" and "handler-graphql-create-schema" plugins...
// TODO: createSchema no longer exists, @see packages/api-headless-cms/src/content/apolloHandler/createApolloHandler.ts
// import { createHandlerApolloServer /*createSchema*/ } from "@webiny/handler-graphql/plugins";

// ...but a custom "handler-graphql-create-handler" plugin is needed.
// import apolloHandler from "./apolloHandler";

// This is a factory function which returns a specific set of plugins depending on
// the provided environment and schema type (read, manage, preview).
import headlessPlugins from "./plugins";
import { graphQLHandlerFactory } from "./graphQLHandlerFactory";
import contextSetup from "./contextSetup";
import { CmsContext } from "@webiny/api-headless-cms/types";
import pluginsCrudSetup from "../plugins/crud";

type CmsContentPluginsIndexArgsType = {
    debug?: boolean;
};
export default (options: CmsContentPluginsIndexArgsType) => [
    pluginsCrudSetup(),
    contextSetup(options),
    {
        type: "handler",
        name: "handler-setup-headless-plugins",
        async handle(context: CmsContext, next) {
            // We register plugins according to the received path params (schema type and environment).
            context.plugins.register(
                await headlessPlugins({
                    type: context.cms.type,
                    environment: context.cms.environment,
                    locale: context.cms.locale
                })
            );
            return next();
        }
    },
    graphQLHandlerFactory(options)
    // createHandlerApolloServer(options),
    // createSchema,
    // apolloHandler
];
