 <span style="background-color: rgb(43, 43, 43)"><code> POST https://ark.cn-beijing.volces.com/api/v3/context/create</code></span><span style="background-color: rgb(43, 43, 43)">   </span>[运行](https://api.volcengine.com/api-explorer/?action=ContextCreate&data=%7B%7D&groupName=%E4%B8%8A%E4%B8%8B%E6%96%87%E7%BC%93%E5%AD%98&query=%7B%7D&serviceCode=ark&version=2024-01-01)
<span style="background-color: rgb(255, 255, 255)">上下文缓存（Context API）是方舟提供的一个高效的缓存机制。它通过缓存上下文数据，减少重复加载或处理，提高响应速度和一致性。本文介绍上下文缓存 API 的输入输出参数，供您使用接口时查阅字段含义。</span>

```mixin-react
return (<Tabs>
<Tabs.TabPane title="快速入口" key="kgxyAQJT"><RenderMd content={` <span>![图片](https://portal.volccdn.com/obj/volcfe/cloud-universal-doc/upload_a5fdd3028d35cc512a10bd71b982b6eb.png =20x) </span>[计费说明](https://www.volcengine.com/docs/82379/1099320#%E4%B8%8A%E4%B8%8B%E6%96%87%E7%BC%93%E5%AD%98%E8%AE%A1%E8%B4%B9)       <span>![图片](https://portal.volccdn.com/obj/volcfe/cloud-universal-doc/upload_afbcf38bdec05c05089d5de5c3fd8fc8.png =20x) </span>[API Key](https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey?apikey=%7B%7D)        <span>![图片](https://portal.volccdn.com/obj/volcfe/cloud-universal-doc/upload_2abecd05ca2779567c6d32f0ddc7874d.png =20x) </span>[支持模型](https://www.volcengine.com/docs/82379/1330310#e6772192)  
 <span>![图片](https://portal.volccdn.com/obj/volcfe/cloud-universal-doc/upload_57d0bca8e0d122ab1191b40101b5df75.png =20x) </span>[调用教程](https://www.volcengine.com/docs/82379/1396491)       <span>![图片](https://portal.volccdn.com/obj/volcfe/cloud-universal-doc/upload_bef4bc3de3535ee19d0c5d6c37b0ffdd.png =20x) </span>[开通模型](https://console.volcengine.com/ark/region:ark+cn-beijing/openManagement?LLM=%7B%7D&OpenTokenDrawer=false)       
`}></RenderMd></Tabs.TabPane>
<Tabs.TabPane title="鉴权说明" key="agb0lYnB"><RenderMd content={`本接口支持 API Key / Access Key鉴权，详见[鉴权认证方式](https://www.volcengine.com/docs/82379/1298459)。
`}></RenderMd></Tabs.TabPane></Tabs>);
 ```


---


<span id="#RxN8G2nH"></span>
## 请求参数 
> 跳转 [响应参数](#Qu59cel0)

<span id="#pjuiBZGA"></span>
### 请求体

---


**model** `string` `必选`
<span style="background-color: rgb(243, 245, 247)">通过 Endpoint ID 来调用模型，获得限流、计费类型（前付费/后付费）、运行状态查询、监控、安全等高级能力，可参考</span>[获取 Endpoint ID](https://www.volcengine.com/docs/82379/1099522)<span style="background-color: rgb(243, 245, 247)">。</span>
> 暂不支持通过 Model ID 来调用。


---


<span style="background-color: rgb(32, 33, 35)"><strong>messages</strong></span><span style="background-color: rgb(32, 33, 35)">  </span><span style="background-color: rgba(238, 242, 245, 0.5)"><code>object[]</code></span><span style="background-color: rgb(32, 33, 35)"> </span>`必选`<span style="background-color: rgb(32, 33, 35)"> </span>
对话组成的消息列表。您希望缓存的信息。
注意：初始化的信息如系统人设，背景信息等，请使用系统消息（System message）放在消息列表最前。这部分信息在2种缓存模式下，均会一直存储在缓存中，直到缓存到期（触达最大生命周期）释放。

属性

---


**系统消息**  `object`
系统消息，<span style="background-color: rgb(32, 33, 35)">开发人员提供的指令，模型应遵循这些指令。如模型扮演的角色或者目标等。</span>

属性

---


messages.**role** <span style="background-color: rgb(var(--gray-100)/.5)"><code>string</code></span><span style="background-color: rgb(var(--gray-100)/.5)"> </span>`必选`
发送消息的角色，此处应为<span style="background-color: rgb(var(--gray-100)/.5)"><code>system</code></span><span style="background-color: rgb(var(--gray-100)/.5)">。</span>

---


messages.**content** <span style="background-color: rgb(var(--gray-100)/.5)"><code>string</code></span><span style="background-color: rgb(var(--gray-100)/.5)"> </span>`必选`
系统信息内容。


---


**用户消息**`object`
<span style="background-color: rgb(32, 33, 35)">用户发送的消息，包含提示或附加上下文信息。</span>

属性

---


messages.**role** <span style="background-color: rgb(var(--gray-100)/.5)"><code>string</code></span><span style="background-color: rgb(var(--gray-100)/.5)"> </span>`必选`
发送消息的角色，此处应为`user`<span style="background-color: rgb(var(--gray-100)/.5)">。</span>

---


messages.**content** <span style="background-color: rgb(var(--gray-100)/.5)"><code>string</code></span><span style="background-color: rgb(var(--gray-100)/.5)"> </span>`必选`
用户信息内容。

---


messages.**name** <span style="background-color: rgba(238, 242, 245, 0.5)"><code>string</code></span><span style="background-color: rgba(238, 242, 245, 0.5)"> </span>
发送此消息的角色的姓名。用于区别同一个角色但是不同主体发送的消息。


---


**模型消息**  `object`
<span style="background-color: rgb(32, 33, 35)">模型响应用户消息而回复的消息。</span>
:::tip
messages.**content**<span style="background-color: rgba(27, 31, 35, 0.05)"><strong> </strong></span><span style="background-color: rgb(255, 255, 255)">与 </span>messages.**tool_calls**<span style="background-color: rgba(27, 31, 35, 0.05)"><strong> </strong></span><span style="background-color: rgb(255, 255, 255)">字段二者至少填写其一。</span>

:::
---


messages.**role** <span style="background-color: rgb(var(--gray-100)/.5)"><code>string</code></span><span style="background-color: rgb(var(--gray-100)/.5)"> </span>`必选`
发送消息的角色，此处应为`assistant`<span style="background-color: rgb(var(--gray-100)/.5)">。</span>

---


messages.**content** <span style="background-color: rgb(32, 33, 35)"><code>string</code></span><span style="background-color: rgb(32, 33, 35)"> </span><span style="background-color: rgb(var(--gray-100)/.5)"> </span>
模型回复的消息。

---


messages.**tool_calls** `object[]`
模型回复的工具调用信息。

属性

---


messages.tool_calls**.function** `object` `必选`
<span style="background-color: rgb(255, 255, 255)">模型调用工具对应的函数信息。</span>

属性

---


messages.tool_calls**.**function.**name** <span style="background-color: rgb(var(--gray-100)/.5)"><code>string</code></span><span style="background-color: rgb(var(--gray-100)/.5)"> </span>`必选`
<span style="background-color: rgb(255, 255, 255)">模型需要调用的函数名称。</span>

---


messages.tool_calls**.**function.<span style="background-color: rgb(255, 255, 255)"><strong>arguments </strong></span><span style="background-color: rgb(var(--gray-100)/.5)"><code>string</code></span><span style="background-color: rgb(var(--gray-100)/.5)"> </span>`必选`
<span style="background-color: rgb(255, 255, 255)">模型生成的用于调用函数的参数，JSON 格式。</span>
:::tip
<span style="background-color: rgb(255, 255, 255)">模型并不总是生成有效的 JSON，并且可能会虚构出一些您的函数参数规范中未定义的参数。在调用函数之前，请在您的代码中验证这些参数是否有效。</span>

:::

---


messages.tool_calls**.id** <span style="background-color: rgb(var(--gray-100)/.5)"><code>string</code></span><span style="background-color: rgb(var(--gray-100)/.5)"> </span>`必选`
<span style="background-color: rgb(255, 255, 255)">调用的工具的 ID。</span>

---


messages.tool_calls**.type** <span style="background-color: rgb(var(--gray-100)/.5)"><code>string</code></span><span style="background-color: rgb(var(--gray-100)/.5)"> </span>`必选`
<span style="background-color: rgb(255, 255, 255)">工具类型，当前仅支持</span><span style="background-color: rgba(27, 31, 35, 0.05)"><code>function</code></span><span style="background-color: rgba(27, 31, 35, 0.05)">。</span>



---


<span style="background-color: rgb(255, 255, 255)"><strong>mode</strong></span><span style="background-color: rgb(255, 255, 255)"> </span>`string` <span style="background-color: rgb(255, 255, 255)"><code>默认值 session</code></span>
<span style="background-color: rgb(255, 255, 255)">本次请求创建的上下文缓存的类型。</span>[点此](https://www.volcengine.com/docs/82379/1398933)<span style="background-color: rgb(255, 255, 255)">了解类型介绍。</span>[点此](https://www.volcengine.com/docs/82379/1330310#e6772192)了解支持的模型 <span style="background-color: rgb(255, 255, 255)">。</span>

* <span style="background-color: rgba(27, 31, 35, 0.05)"><code>session</code></span><span style="background-color: rgb(255, 255, 255)"> ：Session 缓存。</span>
* <span style="background-color: rgba(27, 31, 35, 0.05)"><code>common_prefix</code></span><span style="background-color: rgb(255, 255, 255)"> ：前缀缓存。</span>


---


<span style="background-color: rgb(255, 255, 255)"><strong>ttl</strong></span><span style="background-color: rgb(255, 255, 255)"> </span><span style="background-color: rgb(255, 255, 255)"><code>integer / null</code></span><span style="background-color: rgb(255, 255, 255)"> </span><span style="background-color: rgb(255, 255, 255)"><code>默认值 86400</code></span>
<span style="background-color: rgb(255, 255, 255)">过期时长，单位为秒，设置范围：[3600, 604800]，即1小时到7天。</span>
<span style="background-color: rgb(255, 255, 255)">信息在创建后即开始计时，每次使用则重置为0。计时超过ttl，信息会被从缓存中删除。每次调用chat均根据ttl更新过期时间。</span>

---


<span style="background-color: rgb(255, 255, 255)"><strong>truncation_strategy</strong></span><span style="background-color: rgb(255, 255, 255)"> </span><span style="background-color: rgb(255, 255, 255)"><code>object / null</code></span><span style="background-color: rgb(255, 255, 255)"> </span><span style="background-color: rgb(255, 255, 255)"><code>默认值 null</code></span>
<span style="background-color: rgb(255, 255, 255)">缓存的上下文长度的窗口长度策略配置，只在当 </span><span style="background-color: rgba(27, 31, 35, 0.05)"><strong>mode </strong></span><span style="background-color: rgb(255, 255, 255)">字段设置为</span><span style="background-color: rgba(27, 31, 35, 0.05)"><code>session</code></span><span style="background-color: rgb(255, 255, 255)">，该字段可设置。</span>
<span style="background-color: rgb(255, 255, 255)">支持 Session 缓存的模型能且只能支持 1 种 Session 缓存模式。如不配置该字段，方舟会根据您调用的模型自动适配合适的 Session 缓存模式。</span>

属性
<span style="background-color: rgb(255, 255, 255)"><strong>last_history_tokens 模式 </strong></span><span style="background-color: rgb(255, 255, 255)"><code>object</code></span>
触发缓存上限不会重新计算。

属性

---


<span style="background-color: rgb(255, 255, 255)">truncation_strategy.</span><span style="background-color: rgb(255, 255, 255)"><strong>type </strong></span>`string` `必选`
此处应为 <span style="background-color: rgba(27, 31, 35, 0.05)"><code>last_history_tokens</code></span><span style="background-color: rgba(27, 31, 35, 0.05)">。</span>

---


<span style="background-color: rgb(255, 255, 255)">truncation_strategy.</span><span style="background-color: rgb(255, 255, 255)"><strong>last_history_tokens </strong></span><span style="background-color: rgb(255, 255, 255)"><code>integer</code></span><span style="background-color: rgb(255, 255, 255)"> </span><span style="background-color: rgb(255, 255, 255)"><code>默认值 4096</code></span>
取值范围：` (0,32768)`。
缓存上下文窗口大小，即可缓存的上下文的最大 token 数。触发该上限将根据缓存上下文窗口大小对缓存内容进行清除。清除顺序按照信息被缓存时间长短排序，先清除缓存时间长的信息 。

<span style="background-color: rgb(255, 255, 255)"><strong>rolling_tokens 模式 </strong></span><span style="background-color: rgb(255, 255, 255)"><code>object</code></span>
触发缓存上限会进行重新计算。

属性

---


<span style="background-color: rgb(255, 255, 255)">truncation_strategy.</span><span style="background-color: rgb(255, 255, 255)"><strong>type </strong></span>`string` `必选`
此处应为 `rolling_tokens`<span style="background-color: rgba(27, 31, 35, 0.05)">。</span>

---


<span style="background-color: rgb(255, 255, 255)">truncation_strategy.</span><span style="background-color: rgb(255, 255, 255)"><strong>rolling_tokens </strong></span><span style="background-color: rgb(255, 255, 255)"><code>boolean</code></span><span style="background-color: rgb(255, 255, 255)"> </span><span style="background-color: rgb(255, 255, 255)"><code>默认值 true</code></span>
在缓存中历史消息长度接近 **max_window_tokens** 字段值时，是否自动对历史上下文进行裁剪（按照 message 元素粒度裁剪，按照 message 元素取整，即删除的信息的长度在 **rolling_window_tokens** 范围内，不会截断任意信息）。

* `false`：在历史消息长度超过上下文长度时模型会停止输出（返回字段 **finish_reason** 为`length`)。
* `true`：在历史消息长度接近上下文长度时模型按照先进先出的顺序，自动删除定量（**rolling_window_tokens** 字段值 token 数）的内容，为新对话内容腾挪缓存空间；同时对缓存中的信息进行重新计算和读入，保障内容理解一致性。具体的计算逻辑，请参见 [rolling_tokens 模式](https://www.volcengine.com/docs/82379/1396491#rolling-tokens-%E6%A8%A1%E5%BC%8F)。


---


<span style="background-color: rgb(255, 255, 255)">truncation_strategy.</span>**max_window_tokens** <span style="background-color: rgb(255, 255, 255)"><code>integer / null</code></span><span style="background-color: rgb(255, 255, 255)"> </span><span style="background-color: rgb(255, 255, 255)"><code>默认值 32768</code></span>
在缓存中可存储的历史消息长度最大值。
取值满足下面条件：0 < **rolling_tokens** < **max_window_tokens** < **context window**（模型最大上下文）。

---


<span style="background-color: rgb(255, 255, 255)">truncation_strategy.</span>**rolling_window_tokens** <span style="background-color: rgb(255, 255, 255)"><code>integer / null</code></span><span style="background-color: rgb(255, 255, 255)"> </span><span style="background-color: rgb(255, 255, 255)"><code>默认值 4096</code></span>
当缓存触发了**max_window_tokens** 上限，则会裁剪滚动窗口长度。
取值满足下面条件：0 < **rolling_tokens** < **max_window_tokens** < **context window**（模型最大上下文）。


&nbsp;
<span id="#Qu59cel0"></span>
## 响应参数
> 跳转 [请求参数](#RxN8G2nH)


---


**id** `string`
<span style="background-color: rgb(255, 255, 255)">本次请求创建的上下文缓存的ID，在后续创建带缓存的</span>[上下文缓存对话 API](https://www.volcengine.com/docs/82379/1346560)<span style="background-color: rgb(255, 255, 255)">需要使用。</span>

---


**model** `string`
<span style="background-color: rgb(255, 255, 255)">本次请求使用的推理接入点的 ID 。</span>

---


**mode** `string`
本次请求创建的上下文缓存的类型。[点此](https://www.volcengine.com/docs/82379/1330310#e6772192)了解支持的模型 <span style="background-color: rgb(255, 255, 255)">。</span>

* <span style="background-color: rgba(27, 31, 35, 0.05)"><code>session</code></span><span style="background-color: rgb(255, 255, 255)"> ：Session 缓存。</span>
* <span style="background-color: rgba(27, 31, 35, 0.05)"><code>common_prefix</code></span><span style="background-color: rgb(255, 255, 255)"> ：前缀缓存。</span>


---


**ttl** `integer` 
本次请求创建的上下文缓存<span style="background-color: rgb(255, 255, 255)">过期时长，单位为秒。信息在创建后即开始计时，每次使用则重置为0。计时超过ttl，信息会被从缓存中删除。每次调用chat均根据ttl更新过期时间。</span>
<span style="background-color: rgb(255, 255, 255)">过期时间可以设置的范围在1小时到7天，即[3600, 604800]。</span>

---


**truncation_strategy** `object`
本次请求创建的 Session 缓存使用的截断策略信息。

属性

---


**last_history_tokens 模式** `object`
触发缓存上限，自动滚动缓存内容，无需重新计算。

属性

---


truncation_strategy.**type** `string`
本次请求创建的 Session 缓存的截断策略，此处应为 `last_history_tokens`。

---


truncation_strategy.**last_history_tokens** `integer`
本次请求创建的 Session 缓存可缓存的最大 token 数。


---


**rolling_tokens 模式** `object`
触发缓存上限，进行重新计算。

属性 

---


truncation_strategy.**type** `string`
本次请求创建的 Session 缓存的截断策略，此处应为 `rolling_tokens`。

---


truncation_strategy.**rolling_tokens** <span style="background-color: rgb(255, 255, 255)"><code>boolean</code></span>
本次请求创建的 Session 缓存，当缓存的信息量达到最大缓存窗口时，是否自动处理。



---


**usage** `object`
<span style="background-color: rgb(255, 255, 255)">本次请求的 token 用量。</span>

属性

---


usage.<span style="background-color: rgb(255, 255, 255)"><strong>prompt_tokens </strong></span><span style="background-color: rgb(248, 248, 248)"><code>integer</code></span>
<span style="background-color: rgb(255, 255, 255)">输入的 prompt token 数量。</span>

---


usage.<span style="background-color: rgb(255, 255, 255)"><strong>completion_tokens </strong></span><span style="background-color: rgb(248, 248, 248)"><code>integer</code></span>
<span style="background-color: rgb(255, 255, 255)">模型生成的 token 数量。</span>

---


usage.<span style="background-color: rgb(255, 255, 255)"><strong>total_tokens </strong></span><span style="background-color: rgb(248, 248, 248)"><code>integer</code></span>
<span style="background-color: rgb(255, 255, 255)">本次请求消耗的总 token 数量（输入 + 输出）。</span>

---


usage.<span style="background-color: rgb(255, 255, 255)"><strong>prompt_tokens_details </strong></span><span style="background-color: rgb(255, 255, 255)"><code>object</code></span>
<span style="background-color: rgb(255, 255, 255)">命中上下文缓存的 token 细节。</span>

属性

---


usage.<span style="background-color: rgb(255, 255, 255)">prompt_tokens_details.</span><span style="background-color: rgb(248, 248, 248)"><strong>cached_tokens </strong></span><span style="background-color: rgb(248, 248, 248)"><code>integer</code></span>
<span style="background-color: rgb(255, 255, 255)">命中上下文缓存的 token 数</span><span style="background-color: rgba(27, 31, 35, 0.05)">。</span>




