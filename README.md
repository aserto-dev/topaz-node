# topaz-node

## Directory

The Directory APIs can be used to get, set or delete object instances, relation instances and manifests. They can also be used to check whether a user has a permission or relation on an object instance.

### Directory Client

```ts
type ServiceConfig = {
  url?: string;
  tenantId?: string;
  apiKey?: string;
  caFile?: string;
  insecure?: boolean;
  customHeaders?: { [key: string]: unknown };
};

export type DirectoryConfig = ServiceConfig & {
  reader?: ServiceConfig;
  writer?: ServiceConfig;
  importer?: ServiceConfig;
  exporter?: ServiceConfig;
  model?: ServiceConfig;
};
```

You can initialize a directory client as follows:

```typescript
import { Directory } from "@aserto/aserto-node";

const directoryClient = new Directory({
  url: 'localhost:9292',
  caFile: `${process.env.HOME}/.local/share/topaz/certs/grpc-ca.crt`
});

- `url`: hostname:port of directory service (_required_)
- `apiKey`: API key for directory service (_required_ if using hosted directory)
- `tenantId`: Aserto tenant ID (_required_ if using hosted directory)
- `caFile`: Path to the directory CA file. (optional)
- `insecure`: Skip server certificate and domain verification(optional, defaults to `false`).
- `reader`: ServiceConfig for the reader client(optional)
- `writer`: ServiceConfig for the writer client(option)
- `importer`: ServiceConfig for the importer client(option)
- `exporter`: ServiceConfig for the exporter client(option)
- `model`: ServiceConfig for the model client(option)
```

#### Example
Define a writer client that uses the same credentials but connects to localhost:9393. All other services will have the default configuration
```ts
import { Directory } from "@aserto/aserto-node";

const directoryClient = new Directory({
  url: 'localhost:9292',
  tenantId: '1234',
  apiKey: 'my-api-key',
  writer: {
    url: 'localhost:9393'
  }
});
```

### Getting objects and relations

#### 'object' function

`object({ objectType: "type-name", objectId: "object-id" }, options?: CallOptions)`:

Get an object instance with the type `type-name` and the id `object-id`. For example:

```typescript
const user = await directoryClient.object({ objectType: 'user', objectId: 'euang@acmecorp.com' });

// Handle a specific Directory Error
import { NotFoundError } from  "@aserto/aserto-node"

try {
  directoryClient.object({
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

#### 'relation' function

```typescript
  relation({
    subjectType:  'subject-type',
    subjectId: 'subject-id',
    relation: 'relation-name',
    objectType: 'object-type',
    objectId: 'object-id',
  })
```

Get an relation of a certain type between as subject and an object. For example:

```typescript
const identity = 'euang@acmecorp.com';
const relation = await directoryClient.relation({
  subjectType: 'user',
  subjectId: 'euang@acmecorp.com',
  relation: 'identifier',
  objectType: 'identity'
  objectId: identity
});
```

#### 'relations' function

```typescript
  relations({
    subjectType:  'subject-type',
    relation: 'relation-name',
    objectType: 'object-type',
    objectId: 'object-id',
  })
```

### Setting objects and relations

#### 'setObject' function

`setObject({ object: $Object }, options?: CallOptions)`:

Create an object instance with the specified fields. For example:

```typescript
const user = await directoryClient.setObject(
  {
    object: {
      type: "user",
      id: "test-object",
      properties: {
        displayName: "test object"
      }
    }
  }
);
```

#### 'setRelation' function

`setRelation({ relation: Relation }, options?: CallOptions)`:

Create a relation with a specified name between two objects. For example:

```typescript
const relation = await directoryClient.setRelation({
  subjectId: 'subjectId',
  subjectType: 'subjectType',
  relation: 'relationName',
  objectType: 'objectType',
  objectId: 'objectId',
});
```

#### 'deleteObject' function

`deleteObject({ objectType: "type-name", objectId: "object-id", withRelations: false }, options?: CallOptions)`:

Deletes an object instance with the specified type and key. For example:

```typescript
await directoryClient.deleteObject({ objectType: 'user', objectId: 'euang@acmecorp.com' });
```


#### 'deleteRelation' function

`deleteRelation({ objectType: string, objectId: string, relation: string, subjectType: string, subjectId: string, subjectRelation: string })`:

Delete a relation:

```typescript
await directoryClient.deleteRelation({
  subjectType: 'subjectType',
  subjectId: 'subjectId',
  relation: 'relationName',
  objectType: 'objectType',
  objectId: 'objectId',
});
```

### Checking permissions and relations

You can evaluate graph queries over the directory, to determine whether a subject (e.g. user) has a permission or a relation to an object instance.

#### 'check' function

`check({ objectType: string, objectId: string, relation: string, subjectType: string, subjectId: string, trace: boolean }, options?: CallOptions)`:

Check that an `user` object with the key `euang@acmecorp.com` has the `read` permission in the `admin` group:

```typescript
const check = await directoryClient.check({
  subjectId: 'euang@acmecorp.com',
  subjectType: 'user',
  relation: 'read',
  objectType: 'group',
  objectId: 'admin',
});
```

Check that `euang@acmecorp.com` has an `identifier` relation to an object with key `euang@acmecorp.com` and type `identity`:

```typescript
const check = directoryClient.check({
  subjectId: 'euang@acmecorp.com',
  subjectType: 'user',
  relation: 'identifier',
  objectType: 'identity',
  objectId: 'euang@acmecorp.com',
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

#### 'getManifest' function

```ts
await directoryClient.getManifest();
```

#### 'setManifest' function

```ts
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

#### 'deleteManifest' function

```ts
await directoryClient.deleteManifest();
```

### Import

```ts
import { ImportMsgCase, ImportOpCode, createImportRequest } from "@aserto/aserto-node"
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

```ts
const response = await readAsyncIterable(
  await directoryClient.export({ options: "DATA" })
)

```


### Custom Headers

```ts
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


```ts
import { GetObjectsResponseSchema, toJson } from "@aserto/aserto-node";

const objects = await directoryClient.objects({objectType: "user"});
const json = toJson(GetObjectsResponseSchema, objects)
```


## Authorizer

### Authorizer Client
```ts
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
  customHeaders?: { [key: string]: unknown };

};
```
```ts
const authClient = new Authorizer({
  authorizerServiceUrl: "localhost:8282",
  caFile: `${process.env.HOME}/.local/share/topaz/certs/grpc-ca.crt`
});
```

- `authorizerServiceUrl`: hostname:port of authorizer service (_required_)
- `authorizerApiKey`: API key for authorizer service (_required_ if using hosted authorizer)
- `tenantId`: Aserto tenant ID (_required_ if using hosted authorizer)
- `caFile`: Path to the authorizer CA file. (optional)
- `insecure`: Skip server certificate and domain verification. (NOT SECURE!). Defaults to `false`.

#### Example:
```ts
import {
  Authorizer,
  identityContext,
  policyContext,
  policyInstance,
} from "@aserto/aserto-node";

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
```ts
// Is
// (method) Authorizer.Is(params: IsRequest, options?: CallOptions): Promise<boolean>
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
```ts
await authClient.ListPolicies(
  { policyInstance: { name: "todo" } }
  { headers: { customKey: "customValue" } }
);
```
