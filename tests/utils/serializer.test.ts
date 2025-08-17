// Unit tests for: serializeResponse

import {
  file_aserto_directory_reader_v3_reader,
  GetObjectResponse,
} from "@aserto/node-directory/src/gen/cjs/aserto/directory/reader/v3/reader_pb";

import { InvalidSchemaError, TopazRegistry } from "../../src";

// Mock types
type MockGenMessage = {
  $typeName: string;
};

describe("TopazRegistry.serializeResponse()", () => {
  let topazRegistry: TopazRegistry;

  beforeEach(() => {
    topazRegistry = new TopazRegistry(file_aserto_directory_reader_v3_reader);
  });

  it("serializes a valid response successfully", () => {
    const mockResponse: GetObjectResponse = {
      $typeName: "aserto.directory.reader.v3.GetObjectResponse",
      result: {
        $typeName: "aserto.directory.common.v3.Object",
        type: "user",
        id: "123",
        displayName: "",
        etag: "1234",
      },
      relations: [],
    };

    const result = topazRegistry.serializeResponse(mockResponse);

    expect(result).toEqual({
      relations: [],
      result: {
        id: "123",
        type: "user",
        displayName: "",
        etag: "1234",
      },
    });
  });

  it("throws InvalidSchemaError if schema is not registered", () => {
    const mockResponse: MockGenMessage = {
      $typeName: "invalid.type.name",
    };

    expect(() => topazRegistry.serializeResponse(mockResponse)).toThrow(
      new InvalidSchemaError(
        "schema not registered for type: [invalid.type.name]",
      ),
    );
  });
});
