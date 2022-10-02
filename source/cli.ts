import { KeyPair, makeDataCID, makeKeyPair, makeTestJWS, makeTestVerifiableCredential, TestMethodResolver, featureDetectionMessageBody, collectionQueryMessageBody } from "../tests/helpers";
import fetch from "cross-fetch";
import { RequestSchema } from "./dwn-sdk/core/types";
import {GeneralJwsSigner} from "./dwn-sdk/jose/jws/general/signer";
import  dotenv  from "dotenv";
dotenv.config();

let aliceKey: KeyPair;
let bobKey: KeyPair;
let aliceDid: string;

const DWN_HOST = process.env.DWN_HOST || 'http://localhost:8080';


async function doStuff() {
  aliceKey = await makeKeyPair();
  bobKey = await makeKeyPair();

  aliceDid = `did:key:${GeneralJwsSigner.makeBase64UrlStringFromObject(aliceKey.publicJwk)}`;
}

async function postOneRequest(request: RequestSchema) {
  fetch(DWN_HOST, { 
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

  postOneRequest(featureDetectionMessageBody(aliceDid));

  collectionQueryMessageBody(aliceKey, aliceDid).then(request => {
    postOneRequest(request);
  });
})