import { KeyPair, makeDataCID, makeKeyPair, makeTestJWS, makeTestVerifiableCredential, TestMethodResolver, featureDetectionMessageBody, collectionQueryMessageBody, makeWriteVCMessageBody } from "../tests/helpers";
import fetch from "cross-fetch";
import { RequestSchema } from "./dwn-sdk/core/types";
import {GeneralJwsSigner} from "./dwn-sdk/jose/jws/general/signer";
import  dotenv  from "dotenv";
dotenv.config();

const DWN_HOST = process.env.DWN_HOST || 'http://localhost:8080';

async function doStuff() {
  const aliceKey = await makeKeyPair();
  const bobKey = await makeKeyPair();

  const aliceDid = `did:key:${GeneralJwsSigner.makeBase64UrlStringFromObject(aliceKey.publicJwk)}`;

  await postOneRequest(featureDetectionMessageBody(aliceDid));

  await postOneRequest(await makeWriteVCMessageBody(aliceKey, aliceDid));

  await postOneRequest(await collectionQueryMessageBody(aliceKey, aliceDid));
}

async function postOneRequest(request: RequestSchema) {
  await fetch(DWN_HOST, { 
    method: 'POST',
    body: JSON.stringify(request),
    headers: {
      'Content-Type': 'application/json'
    } }).then((result: any) => {
     result.json().then((result: any) => {
        console.log(JSON.stringify(result, null, 2));
     })
  }).catch((error: any) => {
      console.log(error);
  })
}

doStuff().then(result => {
  console.log("done");
})