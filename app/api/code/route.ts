import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { ChatCompletionResponseMessage, Configuration, OpenAIApi } from "openai";
import { increaseApiLimit,checkApiLimit } from "@/lib/api-limit";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai =  new OpenAIApi(configuration);

const instructionsMessage: ChatCompletionResponseMessage = {
    role: "system",
    content: "you are a code generator. You must answer answer in only markdown code snippets. Use code comments for explantions"
}

export async function POST(
    req:Request
) {
    try{
        const {userId} = auth();
        const body = await req.json();
        const {messages} = body;
        

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
          }
      
          if (!configuration.apiKey) {
            return new NextResponse("OpenAI API Key not configured.", { status: 500 });
          }
      
          if (!messages) {
            return new NextResponse("Messages are required", { status: 400 });
          }
          const freeTrail = await checkApiLimit();
          if(!freeTrail){
            return new NextResponse("Free trail has ended.", {status: 403});
          }
          
          
          const response = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [instructionsMessage, ...messages],

          });
          await increaseApiLimit();
      
  return NextResponse.json(response.data.choices[0].message);
    } catch (error)  {
        console.log("[CODE ERROR]", error);
        return new NextResponse("Internel error", {status: 500});
    }
}