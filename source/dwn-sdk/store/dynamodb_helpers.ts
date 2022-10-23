import { DynamoDBClient, CreateTableCommand, CreateTableCommandInput, ListTablesCommand, PutItemCommand, GetItemCommand, KeySchemaElement, AttributeDefinition } from "@aws-sdk/client-dynamodb";

export function create_table(db: DynamoDBClient, name: string, key_schema: KeySchemaElement[], attribute_definitions: AttributeDefinition[]) {
    const listTablesCommand = new ListTablesCommand({});
    db.send(listTablesCommand).then(async (data) => {
      if (data.TableNames!.includes(name)) {
        console.log('blocks table already exists');
      } else {
        console.log('creating blocks table');
        const params: CreateTableCommandInput = {
          TableName: name,
          KeySchema: key_schema,
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