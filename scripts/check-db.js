import { Client } from 'pg';

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const tablesRes = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;`
    );
    const tables = tablesRes.rows.map(r => r.table_name);
    console.log('Tables in public schema:', tables.join(', ') || '(none)');

    async function showTable(table) {
      const exists = tables.includes(table);
      console.log(`\nTable '${table}':`, exists ? 'exists' : 'missing');
      if (!exists) return;
      const colsRes = await client.query(
        `SELECT column_name, data_type, is_nullable FROM information_schema.columns 
         WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position;`,
        [table]
      );
      for (const r of colsRes.rows) {
        console.log(` - ${r.column_name} :: ${r.data_type} ${r.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      }
    }

    await showTable('contact_messages');
    await showTable('session');
    await showTable('tours_backup');
  } finally {
    await client.end();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

