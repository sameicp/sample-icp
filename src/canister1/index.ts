import {blob, text, update, ic, nat64, Canister, Principal, Record, Some, None, Vec, Opt, query } from 'azle';
import {managementCanister, HttpResponse, HttpTransformArgs} from 'azle/canisters/management';
import Canister2  from '../canister2';

// const TokenCanister = Canister({
//   transfer: update([Principal, nat64], nat64)
// });

const messageCanister: typeof Canister2 = Canister2(
  Principal.fromText(
      'bw4dl-smaaa-aaaaa-qaacq-cai' ??
          ic.trap('process.env.CANISTER2_PRINCIPAL is undefined')
  )
);

const Message = Record({
  id: text,
  title: text,
  body: text,
  attachmentURL: text,
  createdAt: nat64,
  updatedAt: Opt(nat64),
});

const MessagePayload = Record({
  title: text,
  body: text,
  attachmentURL: text,
});

export default Canister({

  // simple and first cross-canister call
  // bkyz2-fmaaa-aaaaa-qaaaq-cai
  randomBytes: update([], blob, async () => {
    return await ic.call(managementCanister.raw_rand);
  }),

  messages: update([], Vec(Message), async()=>{
    if (messageCanister !== undefined) {
      return await ic.call(messageCanister.getMessages, {
        args: []
      });
   }
   return [];   
  }),

  jsonResponse: update([], text, async () => {

    const httpResponse = await ic.call(managementCanister.http_request, {
        args: [
            {
                url: 'https://jsonplaceholder.typicode.com/posts/1',
                max_response_bytes: Some(2_000n),
                method: {
                    get: null
                }, 
                headers: [],
                body: None,
                transform: None
            }
          ],
      cycles: 50_000_000n
    });
    return Buffer.from(httpResponse.body.buffer).toString('utf-8');
  }),

  addMessage1: update([MessagePayload], Message , async (payload)=>{
    return await ic.call(messageCanister.addMessage, {
      args: [payload]
    });
  }),

  xkcd: update([text], HttpResponse, async(post_number)=>{
    return await ic.call(managementCanister.http_request, {
      args: [
        {
          url: `https://jsonplaceholder.typicode.com/posts/${post_number}`,
          max_response_bytes: Some(2_000n),
          method: {
            get: null
          },
          headers: [],
          body: None,
          transform: Some({
            function: [ic.id(), 'xkcdTransform'] as [
              Principal,
              string
            ],
            context: Uint8Array.from([])
          })
        }
      ],
      cycles: 50_000_000n
    })
  }),

  xkcdTransform: query([HttpTransformArgs], HttpResponse, (args)=>{
    return{
      ...args.response,
      headers: []
    };
  })

})