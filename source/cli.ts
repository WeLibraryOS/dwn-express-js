import { KeyPair, makeDataCID, makeKeyPair, makeTestJWS, makeTestVerifiableCredential, featureDetectionMessageBody, collectionQueryMessageBody, makeWriteVCMessageBody, makePermissionGrantMessageBody } from "../tests/helpers";
import fetch from "cross-fetch";
import { RequestSchema } from "./dwn-sdk/core/types";
import {GeneralJwsSigner} from "./dwn-sdk/jose/jws/general/signer";
import fs from 'fs';

const DWN_HOST = process.env.DWN_HOST || 'http://localhost:8080';

function makeDidFromKey(key: KeyPair) {
  return `did:key:${GeneralJwsSigner.makeBase64UrlStringFromObject(key.publicJwk)}`;
}

async function initStuff() {
  if (!fs.existsSync('keys')) {
    fs.mkdirSync('keys');
  }
  else if (fs.existsSync('keys/aliceKey.json') && fs.existsSync('keys/bobKey.json')) {
    return;
  }
    
  const aliceKey = await makeKeyPair();
  const bobKey = await makeKeyPair();

  fs.writeFileSync('keys/aliceKey.json', JSON.stringify(aliceKey))
  fs.writeFileSync('keys/bobKey.json', JSON.stringify(bobKey))
  
  console.log(`Alice's DID: ${makeDidFromKey(aliceKey)}`);
}

async function doStuff() {

  const aliceKey = JSON.parse(fs.readFileSync('keys/aliceKey.json', 'utf8'))
  const bobKey = JSON.parse(fs.readFileSync('keys/bobKey.json', 'utf8'))


  const aliceDid = makeDidFromKey(aliceKey)
  const bobDid = makeDidFromKey(bobKey)

  console.log(`Alice's DID: ${aliceDid}`);
  console.log(`Bob's DID: ${bobDid}`);

  await postOneRequest(featureDetectionMessageBody(aliceDid));

  await postOneRequest(await makeWriteVCMessageBody(aliceKey, aliceDid), 'Alice writes a VC');

  await postOneRequest(await collectionQueryMessageBody(aliceKey, aliceDid));

  await postOneRequest(await makeWriteVCMessageBody(bobKey, bobDid), 'Bob writes a VC');

  await postOneRequest(await makePermissionGrantMessageBody(aliceKey, aliceDid, bobDid), 'Alice grants Bob permission to write');

}

async function postOneRequest(request: RequestSchema, request_name?: string) {
  await fetch(DWN_HOST, { 
    method: 'POST',
    body: JSON.stringify(request),
    headers: {
      'Content-Type': 'application/json'
    } }).then((result: any) => {
     result.json().then((result: any) => {
        console.log(`${request_name || ''} ${JSON.stringify(result, null, 2)}`);
     })
  }).catch((error: any) => {
      console.log(error);
  })
}

if (process.argv[2] === 'init') {
  initStuff().then(result => {
    console.log(result);
  })
} else if (process.argv[2] === 'do') {

  doStuff().then(result => {
    console.log("done");
  })
}