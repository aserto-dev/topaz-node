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

import { InvalidSchemaError } from "../util/errors";

class TopazRegistry {
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
    this.registry = createRegistry(...input);
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

export { TopazRegistry };
