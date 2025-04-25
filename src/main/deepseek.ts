import OpenAI from "openai";
import Utils from "./utils";

export default class Deepseek{
  private BASEURL:string = "https://api.deepseek.com";
  private key:string;
  private model:string;
  private prompt:string = '用户将提供给你一段文档内容，请你分析内容，并提取其中的关键信息，以 JSON 的形式输出，输出的 JSON 需遵守以下的格式：\
\
{\
  "name": <单词或短语>,\
  "description": <单词或短语的描述，除去词性标注>,\
  "example": <对应的例句，没有则为空字符串>,\
  "exampleDescription": <对应的例句翻译，如果例句为空，本项为空，如果例句不为空而这一项为空，请你翻译>\
}';
  private promptExample:string = '用户将提供你一个英语单词或短语以及它的释义，请创造一个简短，能凸显其用法的英语例句，希望尽可能短，并附上翻译，以JSON形式输出，输出的JSON遵循以下格式：\
  \
{\
  "example": <例句>,\
  "description": <翻译>\
}\n'

  public constructor(key:string,model:string){
    this.key = key;
    this.model = model;
  }

  public async handleRawDocument(content:string):Promise<{ name: string; description: string; example:string; exampleDescription:string}[]>{
    let openai = new OpenAI({
      baseURL:this.BASEURL,
      apiKey:this.key
    });
    let completion = await openai.chat.completions.create({
      messages:[
        {
          role:'system',
          content:this.prompt + content
        }
      ],
      model:this.model
    });
    try{
      return JSON.parse(Utils.trimString(Utils.trimString(completion.choices[0].message.content,7,0),0,3));
    }catch(_){
      return [];
    }
  }

  public async handleExampleSentence(item:string,explanation:string):Promise<{
    example:string,
    description:string
  }>{
    let openai = new OpenAI({
      baseURL:this.BASEURL,
      apiKey:this.key
    });
    let completion = await openai.chat.completions.create({
      messages:[
        {
          role:'system',
          content:this.promptExample + `单词或短语：${item}，释义：${explanation}` 
        }
      ],
      model:this.model
    });
    try{
      return JSON.parse(Utils.trimString(Utils.trimString(completion.choices[0].message.content,7,0),0,3));
    }catch(_){
      return {
        example:'',
        description:''
      };
    }
  }
}