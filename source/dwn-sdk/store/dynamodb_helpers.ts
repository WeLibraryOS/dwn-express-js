import { DynamoDBClient, ListTablesCommand, CreateTableCommand, CreateTableCommandInput, KeySchemaElement, AttributeDefinition } from "@aws-sdk/client-dynamodb";

export function create_table(db: DynamoDBClient, name: string, primary_keys: KeySchemaElement[], secondary_keys: KeySchemaElement[] | undefined, attribute_definitions: AttributeDefinition[]) {
        
  const listTablesCommand = new ListTablesCommand({});
  db.send(listTablesCommand).then(async (data) => {
    if (data.TableNames!.includes(name)) {
      console.log(`${name} table already exists`);
    } else {
      console.log(`creating ${name} table`);
      const params: CreateTableCommandInput = {
        TableName: name,
        KeySchema: primary_keys,
        AttributeDefinitions: attribute_definitions,
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      };
      await db.send(new CreateTableCommand(params));
    }}
  ).catch((err) => {
    console.error(`listTablesCommand: ${err}`);
  })
}