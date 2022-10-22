import { DynamoDBClient, CreateTableCommand, CreateTableCommandInput, ListTablesCommand, PutItemCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";

export function create_table(db: DynamoDBClient, name: string) {
    const listTablesCommand = new ListTablesCommand({});
    db.send(listTablesCommand).then(async (data) => {
      if (data.TableNames!.includes('blocks')) {
        console.log('blocks table already exists');
      } else {
        console.log('creating blocks table');
        const params: CreateTableCommandInput = {
          TableName: 'blocks',
          KeySchema: [
            {
              AttributeName: 'cid',
              KeyType: 'HASH'
            }
          ],
          AttributeDefinitions: [
            {
              AttributeName: 'cid',
              AttributeType: 'S'
            },
            
          ],
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