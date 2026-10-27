import { Worker } from '@notionhq/workers';
import { j } from '@notionhq/workers/schema-builder';

const worker = new Worker();
export default worker;

worker.webhook('receiveData', {
  title: 'Receive Data',
  description: 'Receive data from Notion or elsewhere',
  execute: async (events, { notion }) => {
    for (const event of events) {
      const dataSourceId = process.env.DATA_SOURCE_ID;
      if (!dataSourceId) {
        throw new Error('You must define DATA_SOURCE_ID');
      }

      const body = event.body;
      const data = body.data as Record<string, unknown> | undefined;
      const exampleId = data?.id;

      if (typeof exampleId !== 'string' || !exampleId.trim()) {
        throw new Error('Webhook body must include a page identifier as "id"');
      }

      console.log(`Creating a page in ${dataSourceId}`);

      await notion.pages.create({
        parent: { type: 'data_source_id', data_source_id: dataSourceId },
        template: {
          type: 'default',
        },
        properties: {
          Name: {
            title: [
              { text: { content: 'Log ' } },
              { mention: { date: { start: new Date().toISOString() } } },
            ],
          },
          Example: { relation: [{ id: exampleId }] },
        },
      });
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
