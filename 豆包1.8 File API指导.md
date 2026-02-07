Files API 作为文件管理接口，提供文件的上传、检索、列表查询及删除能力。
在多模态理解场景中，Files API 与 Responses API 结合使用，具备以下优势：

* 大文件适配：支持最大 512 MB 文件的上传，满足大文件处理需求。
* 重复使用：支持通过 File ID 在多次请求中重复使用文件，避免重复上传，节省公网下载时延。
* 缩短推理时长：解耦数据预处理与模型推理环节，避免每次请求时重新上传内容，减少预处理导致的时延。

<span id="62e9d75a"></span>
# 前提条件
[获取 API Key](https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey)
<span id="c4765823"></span>
# 查看 API 文档
[Files API 参考](https://www.volcengine.com/docs/82379/1870405)
<span id="821e2a5c"></span>
# Files API 使用示例
<span id="963e0807"></span>
## 上传文件
使用 Files API 可上传多种类型的文件，上传成功后将返回 File ID，File ID 支持在多次请求中重复使用，而不需要重新上传内容，节省公网下载时延。如果文件大于50 MB，或者要在多个请求中重复使用该文件，需使用 Files API 上传文件，然后在 Responses API 中使用 File ID 发起请求。

```mixin-react
return (<Tabs>
<Tabs.TabPane title="Curl" key="FhblgaNgjD"><RenderMd content={`\`\`\`Bash
curl https://ark.cn-beijing.volces.com/api/v3/files \\
-H "Authorization: Bearer $ARK_API_KEY" \\
-F 'purpose=user_data' \\
-F 'file=@/Users/doc/demo.mp4' \\
-F 'preprocess_configs[video][fps]=0.3'
\`\`\`

响应参数如下：
\`\`\`Bash
{
    "object": "file",
    "id": "file-20251018114827-6zgrb",
    "purpose": "user_data",
    "filename": "demo.mp4",
    "bytes": 695110,
    "mime_type": "video/mp4",
    "created_at": 1760759307,
    "expire_at": 1761364107,
    "status": "processing",
    "preprocess_configs": {
        "video": {
            "fps": 0.3
        }
    }
}
\`\`\`

`}></RenderMd></Tabs.TabPane>
<Tabs.TabPane title="Python SDK" key="kIiJOpGgtb"><RenderMd content={`\`\`\`Python
import os
from volcenginesdkarkruntime import Ark

client = Ark(
    base_url='https://ark.cn-beijing.volces.com/api/v3',
    api_key=os.getenv('ARK_API_KEY')
)

file = client.files.create(
    # replace with your local video path
    file=open("/Users/doc/demo.mp4", "rb"),
    purpose="user_data",
    preprocess_configs={
        "video": {
            "fps": 0.3,  # define the sampling fps of the video, default is 1.0
        }
    }
)
print(file)
\`\`\`

`}></RenderMd></Tabs.TabPane>
<Tabs.TabPane title="Go SDK" key="zqqmsnFafH"><RenderMd content={`\`\`\`Go
package main

import (
    "context"
    "fmt"
    "os"

    "github.com/volcengine/volcengine-go-sdk/service/arkruntime"
    "github.com/volcengine/volcengine-go-sdk/service/arkruntime/model/file"
    "github.com/volcengine/volcengine-go-sdk/volcengine"
)

func main() {
    client := arkruntime.NewClientWithApiKey(
        os.Getenv("ARK_API_KEY"),
        arkruntime.WithBaseUrl("https://ark.cn-beijing.volces.com/api/v3"),
    )
    ctx := context.Background()

    data, err := os.Open("/Users/doc/demo.mp4")
    if err != nil {
        fmt.Printf("read file error: %v\\n", err)
        return
    }
    fileInfo, err := client.UploadFile(ctx, &file.UploadFileRequest{
        File:    data,
        Purpose: file.PurposeUserData,
        PreprocessConfigs: &file.PreprocessConfigs{
            Video: &file.Video{
                Fps: volcengine.Float64(0.3),
            },
        },
    })

    if err != nil {
        fmt.Printf("upload file error: %v", err)
        return
    }
    fmt.Printf("file info: %v\\n", fileInfo)

}
\`\`\`

`}></RenderMd></Tabs.TabPane>
<Tabs.TabPane title="Java SDK" key="j5yqPzFcjg"><RenderMd content={`\`\`\`Java
package com.ark.sample;

import com.volcengine.ark.runtime.model.files.FileMeta;
import com.volcengine.ark.runtime.model.files.PreprocessConfigs;
import com.volcengine.ark.runtime.model.files.UploadFileRequest;
import com.volcengine.ark.runtime.model.files.Video;
import com.volcengine.ark.runtime.service.ArkService;
import java.io.File;

public class demo {

    public static void main(String[] args) {
        String apiKey = System.getenv("ARK_API_KEY");
        ArkService service = ArkService.builder().apiKey(apiKey).baseUrl("https://ark.cn-beijing.volces.com/api/v3").build();

        System.out.println("===== Upload File Example=====");
        FileMeta fileMeta;
        fileMeta = service.uploadFile(
                UploadFileRequest.builder().
                        file(new File("/Users/doc/demo.mp4")) // replace with your image file path
                        .purpose("user_data")
                        .preprocessConfigs(PreprocessConfigs.builder().video(new Video(0.3)).build())
                        .build());
        System.out.println("Uploaded file Meta: " + fileMeta);

        service.shutdownExecutor();
    }
}
\`\`\`

`}></RenderMd></Tabs.TabPane>
<Tabs.TabPane title="兼容 OpenAI SDK" key="Cq5GyHEx5s"><RenderMd content={`\`\`\`Python
import os
from openai import OpenAI

client = OpenAI(
    base_url='https://ark.cn-beijing.volces.com/api/v3',
    api_key=os.getenv('ARK_API_KEY')
)

file = client.files.create(
    # replace with your local video path
    file=open("/Users/doc/demo.mp4", "rb"),
    purpose="user_data",
    extra_body={
        "preprocess_configs":{
            "video": {
                "fps": 0.3
            }
        }
    }
)
print(file)
\`\`\`

`}></RenderMd></Tabs.TabPane></Tabs>);
```

<span id="d75377d6"></span>
### 文件存储限制

* 单文件大小：512 MB。
* 总存储容量：20 GB。
* 文件存储时间：默认存储7天，可以通过 **expire_at** 参数自定义存储有效期，取值范围为1\-30天。

:::tip
针对高频存储场景，建议通过缩短文件存储时长、主动调用删除接口清理低频文件这两种方式，做好存储空间的主动管理。
:::
<span id="fd98059d"></span>
### 文件预处理
使用 Files API 上传文件时，接口会根据上传的文件类型进行预处理。

* 视频文件：默认会按1帧/秒（FPS）的速率提取选段，可通过 **preprocess_configs.video.fps** 设置自定义帧速率。长视频且画面变化较小时，可设置较低的 FPS 值；需精细捕捉画面变化时，可设置较高的 FPS 值。文件预处理后，在 Responses API 中使用 File ID，可以缩短推理时长。
* PDF文件：会分页来处理成多图，在预处理时不会对拆分的图片做分辨率缩放，以确保图片能够完整且清晰地保留 PDF 文件中的原始信息。

<span id="82fa7a9c"></span>
### 预处理超时限制
使用 Files API 进行文件预处理的超时限制为 5 min，超时通常会受视频时长、PDF 页数、单页像素、单帧像素等因素影响。
**超时解决方案：** 
优先检查是否存在像素过大的问题，其中对 1080p 视频抽帧操作容易导致超时，建议压缩至 720p 及以下。
> 模型推理阶段会压缩分辨率，所以提升原始像素对最终效果无增益。

**视频压缩工具及命令**
将视频文件压缩至 720p 的命令示例如下。FFmpeg 工具下载参见[下载FFmpeg](http://ffmpeg.org/download.html)。
```Bash
ffmpeg -i input.mp4 \
  -vf "scale=1280:720" \
  -c:v libx264 -crf 23 \
  -c:a aac -b:a 128k \
  output_720p.mp4
```

<span id="81920512"></span>
### 文件类型
Files API 支持多种文件类型，具体如下。

|文件类型 |文件格式 |MIME类型 |
|---|---|---|
|图片 |.jpg、.jpeg、.png、.gif、.webp、.bmp、.tiff、.ico、.icns、.sgi、.jp2、.heic、.heif |`image/jpeg`、`image/png`、`image/gif`、`image/webp`、`image/bmp`、`image/tiff`、`image/x-icon`、`image/icns`、`image/sgi`、`image/jp2`、`image/heic`、`image/heif` |
|视频 |.mp4、.avi、.mov |`video/mp4`、`video/avi`、`video/mov` |
|PDF |.pdf |`application/pdf` |

:::tip
常见问题及解决方案参见[支持 TS 格式的视频文件吗？](/docs/82379/1359411#85251eec)
:::
<span id="91473606"></span>
## 检索文件
通过 File ID 检索文件信息，如文件大小、过期时间、MIME类型及文件处理状态等信息。
> 文件处理状态为**active**时，才可以在 Responses API 中作为模型输入使用。


```mixin-react
return (<Tabs>
<Tabs.TabPane title="Curl" key="CVmOQpQb3c"><RenderMd content={`\`\`\`Bash
curl https://ark.cn-beijing.volces.com/api/v3/files/file-20251014**** \\
-H "Authorization: Bearer $ARK_API_KEY"
\`\`\`

`}></RenderMd></Tabs.TabPane>
<Tabs.TabPane title="Python SDK" key="WdDGIcd7vM"><RenderMd content={`\`\`\`Python
import os
from volcenginesdkarkruntime import Ark

# Get API Key：https://console.volcengine.com/ark/region:ark+cn-beijing/apikey
api_key = os.getenv('ARK_API_KEY')

client = Ark(
    base_url='https://ark.cn-beijing.volces.com/api/v3',
    api_key=api_key,
)

# Retrieve file
response = client.files.retrieve(
    file_id="file-2025******"
)

print(response)
\`\`\`

`}></RenderMd></Tabs.TabPane>
<Tabs.TabPane title="Go SDK" key="xbPd3v7kW4"><RenderMd content={`\`\`\`Go
package main

import (
    "context"
    "fmt"
    "os"

    "github.com/volcengine/volcengine-go-sdk/service/arkruntime"
)

func main() {
    client := arkruntime.NewClientWithApiKey(os.Getenv("ARK_API_KEY"),arkruntime.WithBaseUrl("https://ark.cn-beijing.volces.com/api/v3"))
    ctx := context.Background()

    fileInfo, err := client.RetrieveFile(ctx, "file-20251114****") // update file info
    if err != nil {
        fmt.Printf("get file status error: %v", err)
        return
    }
    fmt.Printf("file info: %v", fileInfo)

}
\`\`\`

`}></RenderMd></Tabs.TabPane>
<Tabs.TabPane title="Java SDK" key="UD7D6D9n9A"><RenderMd content={`\`\`\`Java
package com.ark.sample;

import com.volcengine.ark.runtime.model.files.FileMeta;
import com.volcengine.ark.runtime.service.ArkService;

public class demo {
    public static void main(String[] args) {
        String apiKey = System.getenv("ARK_API_KEY");
        ArkService service = ArkService.builder().apiKey(apiKey).baseUrl("https://ark.cn-beijing.volces.com/api/v3").build();

        // Retrieve file
        FileMeta fileMeta = service.retrieveFile("file-20251117****");
        System.out.println("Retrieve File:" + fileMeta);

        service.shutdownExecutor();
    }
}
\`\`\`

`}></RenderMd></Tabs.TabPane>
<Tabs.TabPane title="兼容 OpenAI SDK" key="Qj1KFaWEGu"><RenderMd content={`\`\`\`Python
import os
from openai import OpenAI

api_key = os.getenv('ARK_API_KEY')

client = OpenAI(
    base_url='https://ark.cn-beijing.volces.com/api/v3',
    api_key=api_key,
)

response = client.files.retrieve(
    file_id="file-20251117****"
)

print(response)
\`\`\`

`}></RenderMd></Tabs.TabPane></Tabs>);
```

<span id="34f747b5"></span>
## 查询文件列表
通过 Files API 查询上传的文件列表。

```mixin-react
return (<Tabs>
<Tabs.TabPane title="Curl" key="NZy6u72rUh"><RenderMd content={`\`\`\`Bash
curl https://ark.cn-beijing.volces.com/api/v3/files \\
-H "Authorization: Bearer $ARK_API_KEY"
\`\`\`

`}></RenderMd></Tabs.TabPane>
<Tabs.TabPane title="Python SDK" key="bo1NeMcEIh"><RenderMd content={`\`\`\`Python
import os
from volcenginesdkarkruntime import Ark

api_key = os.getenv('ARK_API_KEY')

client = Ark(
    base_url='https://ark.cn-beijing.volces.com/api/v3',
    api_key=api_key,
)

response = client.files.list()

print(response)
\`\`\`

`}></RenderMd></Tabs.TabPane>
<Tabs.TabPane title="Go SDK" key="J6xIQ2iSZZ"><RenderMd content={`\`\`\`Go
package main

import (
    "context"
    "fmt"
    "os"

    "github.com/volcengine/volcengine-go-sdk/service/arkruntime"
    "github.com/volcengine/volcengine-go-sdk/service/arkruntime/model/file"
)

func main() {
    client := arkruntime.NewClientWithApiKey(os.Getenv("ARK_API_KEY"),arkruntime.WithBaseUrl("https://ark.cn-beijing.volces.com/api/v3"),)
    ctx := context.Background()

    fileInfo, err := client.ListFiles(ctx, &file.ListFilesRequest{}) 
    if err != nil {
        fmt.Printf("get file List error: %v", err)
        return
    }
    fmt.Printf("file List: %v", fileInfo)
}
\`\`\`

`}></RenderMd></Tabs.TabPane>
<Tabs.TabPane title="Java SDK" key="Ndy1LZFzcy"><RenderMd content={`\`\`\`Java
package com.ark.sample;

import com.volcengine.ark.runtime.model.files.ListFilesResponse;
import com.volcengine.ark.runtime.model.files.ListFilesRequest;
import com.volcengine.ark.runtime.service.ArkService;

public class demo {
    public static void main(String[] args) {
        String apiKey = System.getenv("ARK_API_KEY");
        ArkService service = ArkService.builder().apiKey(apiKey).baseUrl("https://ark.cn-beijing.volces.com/api/v3").build();

        ListFilesRequest request = new ListFilesRequest();
        ListFilesResponse ListFiles = service.listFiles(request);
        System.out.println("List Files:" + ListFiles);

        service.shutdownExecutor();
    }
}
\`\`\`

`}></RenderMd></Tabs.TabPane>
<Tabs.TabPane title="兼容 OpenAI SDK" key="v2XIgT7U4a"><RenderMd content={`\`\`\`Python
import os
from openai import OpenAI

api_key = os.getenv('ARK_API_KEY')

client = OpenAI(
    base_url='https://ark.cn-beijing.volces.com/api/v3',
    api_key=api_key,
)

response = client.files.list()

print(response)
\`\`\`

`}></RenderMd></Tabs.TabPane></Tabs>);
```

<span id="9eb4f3d2"></span>
## 删除文件
针对高频存储场景，做好存储空间管理的方式如下。存储限制，具体参见[文件存储限制](/docs/82379/1885708#d75377d6)。

* 缩短文件存储时长：上传成功的文件默认存储7天，可以通过 **expire_at** 参数自定义存储有效期，取值范围为1\-30天。文件超过存储有效期后会自动删除，参数设置请参见[上传文件](https://www.volcengine.com/docs/82379/1870405)。
* 主动调用删除接口清理低频文件：通过 Files API 删除已上传的文件，使用示例如下。


```mixin-react
return (<Tabs>
<Tabs.TabPane title="Curl" key="sBVBIWGWdw"><RenderMd content={`\`\`\`Bash
curl https://ark.cn-beijing.volces.com/api/v3/files/file-20251014**** \\
-X DELETE \\
-H "Authorization: Bearer $ARK_API_KEY"
\`\`\`

`}></RenderMd></Tabs.TabPane>
<Tabs.TabPane title="Python SDK" key="pOlnPEABog"><RenderMd content={`\`\`\`Python
import os
from volcenginesdkarkruntime import Ark

api_key = os.getenv('ARK_API_KEY')

client = Ark(
    base_url='https://ark.cn-beijing.volces.com/api/v3',
    api_key=api_key,
)

if __name__ == "__main__":
    try:
        client.files.delete(
            file_id="file-20251014****"
        )
    except Exception as e:
        print(f"failed to delete response: {e}")
\`\`\`

`}></RenderMd></Tabs.TabPane>
<Tabs.TabPane title="Go SDK" key="V8m5CPSsLl"><RenderMd content={`\`\`\`Go
package main

import (
    "context"
    "fmt"
    "os"

    "github.com/volcengine/volcengine-go-sdk/service/arkruntime"
)

func main() {
    client := arkruntime.NewClientWithApiKey(os.Getenv("ARK_API_KEY"),arkruntime.WithBaseUrl("https://ark.cn-beijing.volces.com/api/v3"),)
    ctx := context.Background()

    fileInfo, err := client.DeleteFile(ctx, "file-20251114****") 
    if err != nil {
        fmt.Printf("delete file error: %v", err)
        return
    }
    fmt.Printf(" delete file: %v", fileInfo)
}
\`\`\`

`}></RenderMd></Tabs.TabPane>
<Tabs.TabPane title="Java SDK" key="rmmsnHEFDW"><RenderMd content={`\`\`\`Java
package com.ark.sample;

import com.volcengine.ark.runtime.model.files.DeleteFileResponse;
import com.volcengine.ark.runtime.service.ArkService;

public class demo {
    public static void main(String[] args) {
        String apiKey = System.getenv("ARK_API_KEY");
        ArkService service = ArkService.builder().apiKey(apiKey).baseUrl("https://ark.cn-beijing.volces.com/api/v3").build();

        // delete file
        DeleteFileResponse deleteFile = service.deleteFile("file-20251117****");
        System.out.println("Delete File:" + deleteFile);

        service.shutdownExecutor();
    }
}
\`\`\`

`}></RenderMd></Tabs.TabPane>
<Tabs.TabPane title="兼容 OpenAI SDK" key="Bo5Nl3vnwu"><RenderMd content={`\`\`\`Python
import os
from openai import OpenAI

api_key = os.getenv('ARK_API_KEY')

client = OpenAI(
    base_url='https://ark.cn-beijing.volces.com/api/v3',
    api_key=api_key,
)

if __name__ == "__main__":
    try:
        response = client.files.delete(
            file_id="file-20251119****"
        )
        print(response)
    except Exception as e:
        print(f"failed to delete response: {e}")
\`\`\`

`}></RenderMd></Tabs.TabPane></Tabs>);
```

<span id="8a45d4bd"></span>
# 使用 File ID 实现多模态理解
针对文件较大或需在多次请求中重复使用该文件的场景，建议通过 Files API 上传文件，然后在 Responses API 中使用 File ID 的方式实现多模态理解。具体示例参见 [视频理解](/docs/82379/1958521#098ef3d4)、[图片理解](/docs/82379/1958521#70e09284)、[文档理解](/docs/82379/1958521#18a762a5)。
上传文件后，需等待文件处理完成后（即 **status** 为 active 时）才能在 Responses API 中使用对应的 File ID 进行分析。下面是视频理解的示例代码。

```mixin-react
return (<Tabs>
<Tabs.TabPane title="Curl" key="qa37k6Lr79"><RenderMd content={`1. 上传视频文件获取File ID。
   \`\`\`Bash
   curl https://ark.cn-beijing.volces.com/api/v3/files \\
   -H "Authorization: Bearer $ARK_API_KEY" \\
   -F 'purpose=user_data' \\
   -F 'file=@/Users/doc/demo.mp4' \\
   -F 'preprocess_configs[video][fps]=0.3'
   \`\`\`
   
2. 在Responses API中引用File ID。
   \`\`\`Bash
   curl https://ark.cn-beijing.volces.com/api/v3/responses \\
   -H "Authorization: Bearer $ARK_API_KEY" \\
   -H 'Content-Type: application/json' \\
   -d '{
       "model": "doubao-seed-1-6-251015",
       "input": [
           {
               "role": "user",
               "content": [
                   {
                       "type": "input_file",
                       "file_id": "file-20251018****"
                   },
                   {
                       "type": "input_text",
                       "text": "请你描述下视频中的人物的一系列动作，以JSON格式输出开始时间（start_time）、结束时间（end_time）、事件（event）、是否危险（danger），请使用HH:mm:ss表示时间戳。"
                   }
               ]
           }
       ]
   }'
   \`\`\`
   
`}></RenderMd></Tabs.TabPane>
<Tabs.TabPane title="Python SDK" key="nKQvIXHqgu"><RenderMd content={`\`\`\`Python
import asyncio
import os
from volcenginesdkarkruntime import AsyncArk
from volcenginesdkarkruntime.types.responses.response_completed_event import ResponseCompletedEvent
from volcenginesdkarkruntime.types.responses.response_reasoning_summary_text_delta_event import ResponseReasoningSummaryTextDeltaEvent
from volcenginesdkarkruntime.types.responses.response_output_item_added_event import ResponseOutputItemAddedEvent
from volcenginesdkarkruntime.types.responses.response_text_delta_event import ResponseTextDeltaEvent
from volcenginesdkarkruntime.types.responses.response_text_done_event import ResponseTextDoneEvent

client = AsyncArk(
    base_url='https://ark.cn-beijing.volces.com/api/v3',
    api_key=os.getenv('ARK_API_KEY')
)

async def main():
    # upload video file
    print("Upload video file")
    file = await client.files.create(
        # replace with your local video path
        file=open("/Users/doc/demo.mp4", "rb"),
        purpose="user_data",
        preprocess_configs={
            "video": {
                "fps": 0.3,  # define the sampling fps of the video, default is 1.0
            }
        }
    )
    print(f"File uploaded: {file.id}")

    # Wait for the file to finish processing
    await client.files.wait_for_processing(file.id)
    print(f"File processed: {file.id}")

    stream = await client.responses.create(
        model="doubao-seed-1-6-251015",
        input=[
            {"role": "user", "content": [
                {
                    "type": "input_video",
                    "file_id": file.id  # ref video file id
                },
                {
                    "type": "input_text",
                    "text": "请你描述下视频中的人物的一系列动作，以JSON格式输出开始时间（start_time）、结束时间（end_time）、事件（event）、是否危险（danger），请使用HH:mm:ss表示时间戳。"
                }
            ]},
        ],
        caching={
            "type": "enabled",
        },
        store=True,
        stream=True
    )
    
    async for event in stream:
        if isinstance(event, ResponseReasoningSummaryTextDeltaEvent):
            print(event.delta, end="")
        if isinstance(event, ResponseOutputItemAddedEvent):
            print("\\noutPutItem " + event.type + " start:")
        if isinstance(event, ResponseTextDeltaEvent):
            print(event.delta,end="")
        if isinstance(event, ResponseTextDoneEvent):
            print("\\noutPutTextDone.")
        if isinstance(event, ResponseCompletedEvent):
            print("Response Completed. Usage = " + event.response.usage.model_dump_json())

if __name__ == "__main__":
    asyncio.run(main())
\`\`\`

`}></RenderMd></Tabs.TabPane>
<Tabs.TabPane title="Go SDK" key="BZfmnBI3fY"><RenderMd content={`\`\`\`Go
package main

import (
    "context"
    "fmt"
    "io"
    "os"
    "time"

    "github.com/volcengine/volcengine-go-sdk/service/arkruntime"
    "github.com/volcengine/volcengine-go-sdk/service/arkruntime/model/file"
    "github.com/volcengine/volcengine-go-sdk/service/arkruntime/model/responses"
    "github.com/volcengine/volcengine-go-sdk/volcengine"
)

func main() {
    client := arkruntime.NewClientWithApiKey(
        // Get API Key：https://console.volcengine.com/ark/region:ark+cn-beijing/apikey
        os.Getenv("ARK_API_KEY"),
        arkruntime.WithBaseUrl("https://ark.cn-beijing.volces.com/api/v3"),
    )
    ctx := context.Background()

    fmt.Println("----- upload video data -----")
    data, err := os.Open("/Users/doc/demo.mp4")
    if err != nil {
        fmt.Printf("read file error: %v\\n", err)
        return
    }
    fileInfo, err := client.UploadFile(ctx, &file.UploadFileRequest{
        File:    data,
        Purpose: file.PurposeUserData,
        PreprocessConfigs: &file.PreprocessConfigs{
            Video: &file.Video{
                Fps: volcengine.Float64(0.3),
            },
        },
    })

    if err != nil {
        fmt.Printf("upload file error: %v", err)
        return
    }

    // Wait for the file to finish processing
    for fileInfo.Status == file.StatusProcessing {
        fmt.Println("Waiting for video to be processed...")
        time.Sleep(2 * time.Second)
        fileInfo, err = client.RetrieveFile(ctx, fileInfo.ID) // update file info
        if err != nil {
            fmt.Printf("get file status error: %v", err)
            return
        }
    }
    fmt.Printf("Video processing completed: %s, status: %s\\n", fileInfo.ID, fileInfo.Status)
    inputMessage := &responses.ItemInputMessage{
        Role: responses.MessageRole_user,
        Content: []*responses.ContentItem{
            {
                Union: &responses.ContentItem_Video{
                    Video: &responses.ContentItemVideo{
                        Type:   responses.ContentItemType_input_video,
                        FileId: volcengine.String(fileInfo.ID),
                    },
                },
            },
            {
                Union: &responses.ContentItem_Text{
                    Text: &responses.ContentItemText{
                        Type: responses.ContentItemType_input_text,
                        Text: "请你描述下视频中的人物的一系列动作，以JSON格式输出开始时间（start_time）、结束时间（end_time）、事件（event）、是否危险（danger），请使用HH:mm:ss表示时间戳。",
                    },
                },
            },
        },
    }
    createResponsesReq := &responses.ResponsesRequest{
        Model: "doubao-seed-1-6-251015",
        Input: &responses.ResponsesInput{
            Union: &responses.ResponsesInput_ListValue{
                ListValue: &responses.InputItemList{ListValue: []*responses.InputItem{{
                    Union: &responses.InputItem_InputMessage{
                        InputMessage: inputMessage,
                    },
                }}},
            },
        },
        Caching: &responses.ResponsesCaching{Type: responses.CacheType_enabled.Enum()},
    }

    resp, err := client.CreateResponsesStream(ctx, createResponsesReq)
    if err != nil {
        fmt.Printf("stream error: %v\\n", err)
        return
    }
    var responseId string
    for {
        event, err := resp.Recv()
        if err == io.EOF {
            break
        }
        if err != nil {
            fmt.Printf("stream error: %v\\n", err)
            return
        }
        handleEvent(event)
        if responseEvent := event.GetResponse(); responseEvent != nil {
            responseId = responseEvent.GetResponse().GetId()
            fmt.Printf("Response ID: %s", responseId)
        }
    }
}

func handleEvent(event *responses.Event) {
    switch event.GetEventType() {
    case responses.EventType_response_reasoning_summary_text_delta.String():
        print(event.GetReasoningText().GetDelta())
    case responses.EventType_response_reasoning_summary_text_done.String(): // aggregated reasoning text
        fmt.Printf("\\nAggregated reasoning text: %s\\n", event.GetReasoningText().GetText())
    case responses.EventType_response_output_text_delta.String():
        print(event.GetText().GetDelta())
    case responses.EventType_response_output_text_done.String(): // aggregated output text
        fmt.Printf("\\nAggregated output text: %s\\n", event.GetTextDone().GetText())
    default:
        return
    }
}
\`\`\`

`}></RenderMd></Tabs.TabPane>
<Tabs.TabPane title="Java SDK" key="IGODSJ7xOO"><RenderMd content={`\`\`\`Java
package com.ark.sample;

import com.volcengine.ark.runtime.model.files.FileMeta;
import com.volcengine.ark.runtime.model.files.PreprocessConfigs;
import com.volcengine.ark.runtime.model.files.UploadFileRequest;
import com.volcengine.ark.runtime.model.files.Video;
import com.volcengine.ark.runtime.service.ArkService;
import com.volcengine.ark.runtime.model.responses.request.*;
import com.volcengine.ark.runtime.model.responses.item.ItemEasyMessage;
import com.volcengine.ark.runtime.model.responses.constant.ResponsesConstants;
import com.volcengine.ark.runtime.model.responses.item.MessageContent;
import com.volcengine.ark.runtime.model.responses.content.InputContentItemVideo;
import com.volcengine.ark.runtime.model.responses.content.InputContentItemText;

import com.volcengine.ark.runtime.model.responses.event.functioncall.FunctionCallArgumentsDoneEvent;
import com.volcengine.ark.runtime.model.responses.event.outputitem.OutputItemAddedEvent;
import com.volcengine.ark.runtime.model.responses.event.outputitem.OutputItemDoneEvent;
import com.volcengine.ark.runtime.model.responses.event.outputtext.OutputTextDeltaEvent;
import com.volcengine.ark.runtime.model.responses.event.outputtext.OutputTextDoneEvent;
import com.volcengine.ark.runtime.model.responses.event.reasoningsummary.ReasoningSummaryTextDeltaEvent;
import com.volcengine.ark.runtime.model.responses.event.response.ResponseCompletedEvent;
import java.io.File;
import java.util.concurrent.TimeUnit;

public class demo {
    public static void main(String[] args) {
        String apiKey = System.getenv("ARK_API_KEY");
        ArkService service = ArkService.builder().apiKey(apiKey).baseUrl("https://ark.cn-beijing.volces.com/api/v3").build();

        System.out.println("===== Upload File Example=====");
        // upload a video for responses
        FileMeta fileMeta;
        fileMeta = service.uploadFile(
                UploadFileRequest.builder().
                        file(new File("/Users/doc/demo.mp4")) // replace with your image file path
                        .purpose("user_data")
                        .preprocessConfigs(PreprocessConfigs.builder().video(new Video(0.3)).build())
                        .build());
        System.out.println("Uploaded file Meta: " + fileMeta);
        System.out.println("status:" + fileMeta.getStatus());

        try {
            while (fileMeta.getStatus().equals("processing")) {
                System.out.println("Waiting for video to be processed...");
                TimeUnit.SECONDS.sleep(2);
                fileMeta = service.retrieveFile(fileMeta.getId());
            }
        } catch (Exception e) {
            System.err.println("get file status error：" + e.getMessage());
        }
        System.out.println("Uploaded file Meta: " + fileMeta);

        CreateResponsesRequest request = CreateResponsesRequest.builder()
                .model("doubao-seed-1-6-251015")
                .stream(true)
                .input(ResponsesInput.builder().addListItem(
                        ItemEasyMessage.builder().role(ResponsesConstants.MESSAGE_ROLE_USER).content(
                                MessageContent.builder()
                                        .addListItem(InputContentItemVideo.builder().fileId(fileMeta.getId()).build())
                                        .addListItem(InputContentItemText.builder().text("请你描述下视频中的人物的一系列动作，以JSON格式输出开始时间（start_time）、结束时间（end_time）、事件（event）、是否危险（danger），请使用HH:mm:ss表示时间戳。").build())
                                        .build()
                        ).build()
                ).build())
                .build();

        service.streamResponse(request)
                .doOnError(Throwable::printStackTrace)
                .blockingForEach(event -> {
                    if (event instanceof ReasoningSummaryTextDeltaEvent) {
                        System.out.print(((ReasoningSummaryTextDeltaEvent) event).getDelta());
                    }
                    if (event instanceof OutputItemAddedEvent) {
                        System.out.println("\\nOutputItem " + (((OutputItemAddedEvent) event).getItem().getType()) + " Start: ");
                    }
                    if (event instanceof OutputTextDeltaEvent) {
                        System.out.print(((OutputTextDeltaEvent) event).getDelta());
                    }
                    if (event instanceof OutputTextDoneEvent) {
                        System.out.println("\\nOutputText End.");
                    }
                    if (event instanceof OutputItemDoneEvent) {
                        System.out.println("\\nOutputItem " + ((OutputItemDoneEvent) event).getItem().getType() + " End.");
                    }
                    if (event instanceof FunctionCallArgumentsDoneEvent) {
                        System.out.println("\\nFunctionCall Arguments: " + ((FunctionCallArgumentsDoneEvent) event).getArguments());
                    }
                    if (event instanceof ResponseCompletedEvent) {
                        System.out.println("\\nResponse Completed. Usage = " + ((ResponseCompletedEvent) event).getResponse().getUsage());
                    }
                });


        service.shutdownExecutor();
    }
}
\`\`\`

`}></RenderMd></Tabs.TabPane>
<Tabs.TabPane title="兼容 OpenAI SDK" key="sGGbMNXIjQ"><RenderMd content={`\`\`\`Python
import os
import time
from openai import OpenAI

api_key = os.getenv('ARK_API_KEY')

client = OpenAI(
    base_url='https://ark.cn-beijing.volces.com/api/v3',
    api_key=api_key,
)

file = client.files.create(
    file=open("/Users/doc/demo.mp4", "rb"),
    purpose="user_data"
)
# Wait for the file to finish processing
while (file.status == "processing"):
    time.sleep(2)
    file = client.files.retrieve(file.id)
print(f"File processed: {file}")
    
response = client.responses.create(
    model="doubao-seed-1-6-251015",
    input=[
        {
            "role": "user",
            "content": [
                {
                    "type": "input_video",
                    "file_id": file.id,
                },
                {
                    "type": "input_text",
                    "text": "请你描述下视频中的人物的一系列动作，以JSON格式输出开始时间（start_time）、结束时间（end_time）、事件（event）、是否危险（danger），请使用HH:mm:ss表示时间戳。",
                },
            ]
        }
    ],
    stream=True
)


for event in response:
    if event.type == "response.reasoning_summary_text.delta":
        print(event.delta, end="")
    if event.type == "response.output_item.added":
        print("\\noutPutItem " + event.type + " start:")
    if event.type == "response.output_text.delta":
        print(event.delta,end="")
    if event.type == "response.output_item.done":
        print("\\noutPutTextDone.")
    if event.type == "response.completed":
        print("\\nResponse Completed. Usage = " + event.response.usage.model_dump_json())
\`\`\`

`}></RenderMd></Tabs.TabPane></Tabs>);
```

<span id="5a0c8d52"></span>
# 计费说明
每个账户有 20 GB 免费存储额度，超出后无法上传文件，删除文件释放存储空间可继续上传文件。
<span id="b2c2dfe3"></span>
# 使用限制及错误码

* Files API QPS限流及带宽限制如下。
   * 上传文件：20 QPS、100 Mbps带宽
   * 检索文件：20 QPS
   * 查询文件列表：20 QPS
   * 删除文件：20 QPS
* 错误码：单击[错误码](/docs/82379/1299023)，获取相关信息。



