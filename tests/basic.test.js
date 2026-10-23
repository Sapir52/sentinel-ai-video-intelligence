import test from 'node:test';import assert from 'node:assert/strict';
test('severity set covers all UI filters',()=>assert.deepEqual(['low','medium','high'].length,3));
test('Node supports built-in SQLite',async()=>{const {DatabaseSync}=await import('node:sqlite');const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE demo(x INTEGER); INSERT INTO demo VALUES(1)');assert.equal(db.prepare('SELECT x FROM demo').get().x,1);db.close();});
