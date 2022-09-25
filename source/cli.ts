import { KeyPair, makeDataCID, makeKeyPair, makeTestJWS, makeTestVerifiableCredential, TestMethodResolver, featureDetectionMessageBody } from "../tests/helpers";
import fetch from "cross-fetch";

let aliceKey: KeyPair;
let bobKey: KeyPair;

async function doStuff() {
  aliceKey = await makeKeyPair();
  bobKey = await makeKeyPair();
}

doStuff().then(result => {

    fetch('http://localhost:8080', { method: 'POST', body: JSON.stringify(featureDetectionMessageBody('did:test:alice')) }).then((result: any) => {
       result.json().then((result: any) => {
          console.log(result);
       })
    }).catch((error: any) => {
        console.log(error);
    })
})