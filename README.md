# topaz-node

A Node.js client for interacting with the Topaz Directory and Authorizer APIs.

---

## Table of Contents

- [Directory](#directory)
  - [Directory Client](#directory-client)
  - [Getting Objects and Relations](#getting-objects-and-relations)
  - [Setting Objects and Relations](#setting-objects-and-relations)
  - [Checking Permissions and Relations](#checking-permissions-and-relations)
  - [Manifest](#manifest)
  - [Import](#import)
  - [Export](#export)
  - [Custom Headers](#custom-headers)
  - [Serializing Data](#serializing-data)
- [Authorizer](#authorizer)
  - [Authorizer Client](#authorizer-client)
  - [Methods](#methods)
  - [Custom Headers](#custom-headers-1)

---

## Directory

The Directory APIs can be used to get, set, or delete object instances, relation instances, and manifests. They can also be used to check whether a user has a permission or relation on an object instance.

### Directory Client

#### Configuration Types

```typescript
type ServiceConfig = {
  url?: string;
  tenantId?: string;
  apiKey?: string;
  caFile?: string;
  insecure?: boolean;
};

export type DirectoryConfig = ServiceConfig & {
  reader?: ServiceConfig;
  writer?: ServiceConfig;
  importer?: ServiceConfig;
  exporter?: ServiceConfig;
  model?: ServiceConfig;
};
```

#### Initialization

You can initialize a directory client as follows:

```typescript
import { Directory } from "topaz-node";

const directoryClient = new Directory({
  url: 'localhost:9292',
  caFile: `${process.env.HOME}/.local/share/topaz/certs/grpc-ca.crt`
});
```

**Parameters:**

- `url`: Hostname:port of directory service (**required**)
- `apiKey`: API key for directory service (**required** if using hosted directory)
- `tenantId`: Aserto tenant ID (**required** if using hosted directory)
- `caFile`: Path to the directory CA file (optional)
- `insecure`: Skip server certificate and domain verification (optional, defaults to `false`)
- `reader`: ServiceConfig for the reader client (optional)
- `writer`: ServiceConfig for the writer client (optional)
- `importer`: ServiceConfig for the importer client (optional)
- `exporter`: ServiceConfig for the exporter client (optional)
- `model`: ServiceConfig for the model client (optional)

#### Example: Custom Writer Client

Define a writer client that uses the same credentials but connects to `localhost:9393`. All other services will have the default configuration:

```typescript
import { Directory } from "topaz-node";

const directoryClient = new Directory({
  url: 'localhost:9292',
  tenantId: '1234',
  apiKey: 'my-api-key',
  writer: {
    url: 'localhost:9393'
  }
});
```

### Getting Objects and Relations

#### `object` function

Get an object instance with the specified type and id.

```typescript
const user = await directoryClient.object({ objectType: 'user', objectId: 'euang@acmecorp.com' });
```

Handle a specific Directory Error:

```typescript
import { NotFoundError } from  "topaz-node";

try {
  await directoryClient.object({
    objectType: "user",
    objectId: "euang@acmecorp.com",
  });
} catch (error) {
  if (error instanceof NotFoundError) {
    // handle the case where the object was not found
  }
  throw error;
}
```

#### `relation` function

Get a relation of a certain type between a subject and an object.

```typescript
const identity = 'euang@acmecorp.com';
const relation = await directoryClient.relation({
  subjectType: 'user',
  subjectId: 'euang@acmecorp.com',
  relation: 'identifier',
  objectType: 'identity',
  objectId: identity
});
```

#### `relations` function

Get all relations of a certain type for a given object.

```typescript
const relations = await directoryClient.relations({
  subjectType: 'subject-type',
  relation: 'relation-name',
  objectType: 'object-type',
  objectId: 'object-id',
});
```

### Setting Objects and Relations

#### `setObject` function

Create an object instance with the specified fields.

```typescript
const user = await directoryClient.setObject({
  object: {
    type: "user",
    id: "test-object",
    properties: {
      displayName: "test object"
    }
  }
});
```

#### `setRelation` function

Create a relation with a specified name between two objects.

```typescript
const relation = await directoryClient.setRelation({
  subjectId: 'subjectId',
  subjectType: 'subjectType',
  relation: 'relationName',
  objectType: 'objectType',
  objectId: 'objectId',
});
```

#### `deleteObject` function

Delete an object instance with the specified type and key.

```typescript
await directoryClient.deleteObject({ objectType: 'user', objectId: 'euang@acmecorp.com' });
```

#### `deleteRelation` function

Delete a relation between two objects.

```typescript
await directoryClient.deleteRelation({
  subjectType: 'subjectType',
  subjectId: 'subjectId',
  relation: 'relationName',
  objectType: 'objectType',
  objectId: 'objectId',
});
```

### Checking Permissions and Relations

You can evaluate graph queries over the directory to determine whether a subject (e.g., user) has a permission or a relation to an object instance.

#### `check` function

Check that a `user` object with the key `euang@acmecorp.com` has the `read` permission in the `admin` group:

```typescript
const check = await directoryClient.check({
  subjectId: 'euang@acmecorp.com',
  subjectType: 'user',
  relation: 'read',
  objectType: 'group',
  objectId: 'admin',
});
```

### Example

```typescript
const identity = 'euang@acmecorp.com';
const relation = await directoryClient.relation(
  {
    subjectType: 'user',
    objectType: 'identity',
    objectId: identity,
    relation: 'identifier',
    subjectId: 'euang@acmecorp.com'
  }
);

if (!relation) {
  throw new Error(`No relations found for identity ${identity}`)
};

const user = await directoryClient.object(
  { objectId: relation.subjectId, objectType: relation.subjectType }
);
```

### Manifest

You can get, set, or delete the manifest

#### `getManifest` function

```typescript
await directoryClient.getManifest();
```

#### `setManifest` function

```typescript
await directoryClient.setManifest(`
# yaml-language-server: $schema=https://www.topaz.sh/schema/manifest.json
---
### model ###
model:
  version: 3

### object type definitions ###
types:
  ### display_name: User ###
  user:
    relations:
      ### display_name: user#manager ###
      manager: user

  ### display_name: Identity ###
  identity:
    relations:
      ### display_name: identity#identifier ###
      identifier: user

  ### display_name: Group ###
  group:
    relations:
      ### display_name: group#member ###
      member: user
    permissions:
      read: member
`);
```

#### `deleteManifest` function

```typescript
await directoryClient.deleteManifest();
```

### Import

```typescript
import { ImportMsgCase, ImportOpCode, createImportRequest } from "topaz-node"
const importRequest = createImportRequest([
  {
    opCode: ImportOpCode.SET,
    msg: {
      case: ImportMsgCase.OBJECT,
      value: {
        id: "import-user",
        type: "user",
        properties: { foo: "bar" },
        displayName: "name1",
      },
    },
  },
  {
    opCode: ImportOpCode.SET,
    msg: {
      case: ImportMsgCase.OBJECT,
      value: {
        id: "import-group",
        type: "group",
        properties: {},
        displayName: "name2",
      },
    },
  },
  {
    opCode: ImportOpCode.SET,
    msg: {
      case: ImportMsgCase.RELATION,
      value: {
        subjectId: "import-user",
        subjectType: "user",
        objectId: "import-group",
        objectType: "group",
        relation: "member",
      },
    },
  },
]);

const resp = await directoryClient.import(importRequest);
await (readAsyncIterable(resp))
```

### Export

```typescript
const response = await readAsyncIterable(
  await directoryClient.export({ options: "DATA" })
)

```


### Custom Headers

```typescript
// passing custom headers to a request
const user = await directoryClient.object(
  {
    objectType: "user",
    objectId: "euang@acmecorp.com",
  },
  {
    headers: {
      customKey: "customValue",
    },
  }
);
```

### Serializing data

Use [Protocol Buffers](https://github.com/bufbuild/protobuf-es) to serialize data.


```typescript
import { GetObjectsResponseSchema, toJson } from "topaz-node";

const objects = await directoryClient.objects({objectType: "user"});
const json = toJson(GetObjectsResponseSchema, objects)
```


## Authorizer

### Authorizer Client
```typescript
interface Authorizer {
  config: AuthorizerConfig,
};

type AuthorizerConfig = {
  authorizerServiceUrl?: string;
  tenantId?: string;
  authorizerApiKey?: string;
  token?: string;
  caFile?: string;
  insecure?: boolean;
};
```
```typescript
const authClient = new Authorizer({
  authorizerServiceUrl: "localhost:8282",
  caFile: `${process.env.HOME}/.local/share/topaz/certs/grpc-ca.crt`
});
```

- `authorizerServiceUrl`: Hostname:port of authorizer service (**required**)
- `authorizerApiKey`: API key for authorizer service (**required** if using hosted authorizer)
- `tenantId`: Aserto tenant ID (**required** if using hosted authorizer)
- `caFile`: Path to the authorizer CA file (optional)
- `insecure`: Skip server certificate and domain verification (optional, defaults to `false`)

#### Example:
```typescript
import {
  Authorizer,
  identityContext,
  policyContext,
  policyInstance,
} from "topaz-node";

const authClient = new Authorizer(
  {
    authorizerServiceUrl: "localhost:8282",
    caFile: `${process.env.HOME}/.local/share/topaz/certs/grpc-ca.crt`
  },
);

authClient
  .Is({
    identityContext: {
      identity: "rick@the-citadel.com",
      type: IdentityType.SUB,
    },
    policyInstance: {
      name: "rebac",
    },
    policyContext: {
      path: "rebac.check",
      decisions: ["allowed"],
    },
    resourceContext: {
      object_type: "group",
      object_id: "evil_genius",
      relation: "member",
    },
  })
```

### Methods
```typescript
// Is
// (method) Authorizer.Is(params: IsRequest, options?: CallOptions): Promise<IsResponse>
await authClient
  .Is({
    identityContext: {
      identity: "rick@the-citadel.com",
      type: IdentityType.SUB,
    },
    policyInstance: {
      name: "todo",
    },
    policyContext: {
      path: "todoApp.POST.todos",
      decisions: ["allowed"],
    },
    resourceContext: {
      ownerID: "fd1614d3-c39a-4781-b7bd-8b96f5a5100d",
    },
  })

// Query
// (method) Authorizer.Query(params: QueryRequest, options?: CallOptions): Promise<JsonObject>
await authClient
  .Query({
    identityContext: {
      identity: "rick@the-citadel.com",
      type: IdentityType.SUB,
    },
    policyInstance: {
      name: "todo",
    },
    policyContext: {
      path: "todoApp.POST.todos",
      decisions: ["allowed"],
    },
    resourceContext: {
      ownerID: "fd1614d3-c39a-4781-b7bd-8b96f5a5100d",
    },
    query: "x = data",
  })


// DecisionTree
// (method) Authorizer.DecisionTree(params: DecisionTreeRequest, options?: CallOptions): Promise<{
//     path: Path;
//     pathRoot: string;
// }>
await authClient
  .DecisionTree({
    identityContext: {
      identity: "rick@the-citadel.com",
      type: IdentityType.SUB,
    },
    policyInstance: {
      name: "todo",
    },
    policyContext: {
      path: "todoApp.POST.todos",
      decisions: ["allowed"],
    },
    resourceContext: {
      ownerID: "fd1614d3-c39a-4781-b7bd-8b96f5a5100d",
    },
  })


// ListPolicies
// (method) Authorizer.ListPolicies(params: PlainMessage<ListPoliciesRequest>, options?: CallOptions): Promise<Module[]>
await authClient.ListPolicies({ policyInstance: { name: "todo" } })
```

#### Custom Headers
```typescript
await authClient.ListPolicies(
  { policyInstance: { name: "todo" } }
  { headers: { customKey: "customValue" } }
);
```
