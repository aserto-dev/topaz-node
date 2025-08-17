import {
  createRegistry,
  DescEnum,
  DescExtension,
  DescFile,
  DescMessage,
  DescService,
  Message,
  MessageShape,
  Registry,
  toJson,
} from "@bufbuild/protobuf";
import { GenMessage } from "@bufbuild/protobuf/codegenv1";
import { file_google_protobuf_timestamp } from "@bufbuild/protobuf/wkt";

import { InvalidSchemaError } from "../util/errors";
import {
  file_aserto_authorizer_v2_api_decision_logs,
  file_aserto_authorizer_v2_api_identity_context,
  file_aserto_authorizer_v2_api_module,
  file_aserto_authorizer_v2_api_policy_context,
  file_aserto_authorizer_v2_api_policy_instance,
  file_aserto_authorizer_v2_authorizer,
} from "./types";

class AuthorizerRegistry {
  registry: Registry;

  constructor(
    ...input: (
      | DescEnum
      | DescExtension
      | DescFile
      | DescMessage
      | DescService
      | Registry
    )[]
  ) {
    this.registry = createRegistry(
      file_aserto_authorizer_v2_api_decision_logs,
      file_aserto_authorizer_v2_api_identity_context,
      file_aserto_authorizer_v2_api_module,
      file_aserto_authorizer_v2_api_policy_instance,
      file_aserto_authorizer_v2_api_policy_context,
      file_aserto_authorizer_v2_authorizer,
      file_google_protobuf_timestamp,
      ...input,
    );
  }

  serializeResponse<T extends Message>(
    response: MessageShape<GenMessage<T>>,
  ): T {
    const schema = this.registry.getMessage(response.$typeName);
    if (!schema) {
      throw new InvalidSchemaError(
        `schema not registered for type: [${response.$typeName}]`,
      );
    }
    return toJson(schema, response, {
      alwaysEmitImplicit: true,
      registry: this.registry,
    }) as unknown as T;
  }
}

export { AuthorizerRegistry };
