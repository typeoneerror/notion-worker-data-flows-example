import { Worker } from '@notionhq/workers';
import { j } from '@notionhq/workers/schema-builder';
import type { Client, CreatePageResponse } from '@notionhq/client';
import type { RichTextItemRequest } from '@notionhq/client/build/src/api-endpoints.js';

const worker = new Worker();
export default worker;

async function createLog(
  notion: Client,
  title: RichTextItemRequest[],
  exampleId: string
): Promise<CreatePageResponse> {
  // Use the data source by ID via an environment variable
  const dataSourceId = process.env.DATA_SOURCE_ID;
  if (!dataSourceId) {
    throw new Error('You must define DATA_SOURCE_ID');
  }

  // Logs are sent to Notion's tui and gui as we'll see
  console.log(`Creating a page in ${dataSourceId}`);

  // Use the Notion API to create a page in the specified data source
  // We "await" here because this is an asynchronous request.
  return await notion.pages.create({
    parent: { type: 'data_source_id', data_source_id: dataSourceId },
    template: {
      type: 'default',
    },
    properties: {
      Name: {
        title,
      },
      Example: { relation: [{ id: exampleId }] },
    },
  });
}

worker.webhook('receiveData', {
  title: 'Receive Data',
  description: 'Receive data from Notion or elsewhere',
  execute: async (events, { notion }) => {
    for (const event of events) {
      // The data sent via the webhook is in the body of the event
      const body = event.body;
      // Get the data sent in the event body
      const data = body.data as Record<string, unknown> | undefined;
      // The id of the page is sent as "id"
      const exampleId = data?.id;

      // Make sure our id is valid
      if (typeof exampleId !== 'string' || !exampleId.trim()) {
        throw new Error('Webhook body must include a page identifier as "id"');
      }

      const title: RichTextItemRequest[] = [
        { text: { content: 'Log ' } },
        { mention: { date: { start: new Date().toISOString() } } },
      ];

      const page = await createLog(notion, title, exampleId);

      // We'll be able to see the created page or do something else with it now...
      console.log(page);
    }
  },
});

// Example agent tool that returns a greeting
// Delete this when you're ready to start building your own tools.
worker.tool('sayHello', {
  title: 'Say Hello',
  description: 'Returns a friendly greeting for the given name.',
  schema: j.object({
    name: j.string().describe('The name to greet.'),
  }),
  execute: ({ name }) => {
    return `Hello there, ${name}!`;
  },
});
