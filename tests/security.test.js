import test from 'node:test';
import assert from 'node:assert/strict';
import {validateId,safeSearch,createLimiter} from '../server/security.js';
test('rejects malformed database IDs',()=>{assert.equal(validateId('1'),1);for(const id of ['-2','1.2','foo','0'])assert.equal(validateId(id),null)});
test('bounds and escapes search terms',()=>{assert.equal(safeSearch('ABC'), 'abc');assert.equal(safeSearch('%_'), '\\%\\_');assert.ok(safeSearch('x'.repeat(200)).length<=100)});
test('rate limiter returns 429 after budget',()=>{const limiter=createLimiter({max:2});const req={ip:'127.0.0.1'};let status=0;const res={set(){return this},status(code){status=code;return this},json(){return this}};let calls=0;for(let i=0;i<3;i++)limiter(req,res,()=>calls++);assert.equal(calls,2);assert.equal(status,429)});
