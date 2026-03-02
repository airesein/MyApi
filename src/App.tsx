/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Book, Globe, MessageSquare, Image as ImageIcon, Settings, AlertTriangle, ExternalLink } from 'lucide-react';

export default function App() {
  const [visitorInfo, setVisitorInfo] = useState<any>(null);
  const [hitokoto, setHitokoto] = useState<string>('');
  const [appUrl, setAppUrl] = useState('');

  useEffect(() => {
    setAppUrl(window.location.origin);

    // 获取访客信息
    fetch('api/visitor')
      .then(res => {
        if (res.status === 403) throw new Error('域名未授权 (请检查 config/domain.txt)');
        return res.json();
      })
      .then(data => setVisitorInfo(data))
      .catch(err => setVisitorInfo({ error: err.message }));

    // 获取一言
    fetch('api/hitokoto?format=json')
      .then(res => {
        if (res.status === 403) throw new Error('域名未授权');
        return res.json();
      })
      .then(data => setHitokoto(data.hitokoto))
      .catch(err => setHitokoto(err.message));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Header */}
        <header className="space-y-4 border-b border-slate-200 pb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
              <Book className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Serverless API 系统</h1>
              <p className="text-slate-500 mt-1">基于文件配置的轻量级 API 服务</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 text-sm text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">域名白名单提示：</p>
              <p>如果 API 调用失败并提示 "Domain not allowed"，请将当前域名添加到 <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded text-amber-800">config/domain.txt</code> 文件中。</p>
              <p className="mt-2 text-xs text-amber-700">当前域名: <code className="font-mono font-bold">{appUrl ? new URL(appUrl).hostname : '加载中...'}</code></p>
            </div>
          </div>
        </header>

        {/* Live Demo Section */}
        <section className="grid md:grid-cols-2 gap-6">
          {/* Visitor Info Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-500" />
                访客信息 (Visitor)
              </h2>
              <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-mono">GET /api/visitor</span>
            </div>
            <div className="bg-slate-900 text-slate-50 p-4 rounded-xl font-mono text-xs md:text-sm overflow-x-auto min-h-[160px]">
              {visitorInfo ? JSON.stringify(visitorInfo, null, 2) : '加载中...'}
            </div>
          </div>

          {/* Hitokoto Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-500" />
                一言 (Hitokoto)
              </h2>
              <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-mono">GET /api/hitokoto</span>
            </div>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 mb-4 min-h-[100px] flex items-center justify-center text-center">
              <p className="italic text-slate-700 font-serif text-lg">
                "{hitokoto || '加载中...'}"
              </p>
            </div>
            <div className="flex gap-2 justify-end">
               <button 
                 onClick={() => window.location.reload()} 
                 className="text-xs text-blue-600 hover:underline flex items-center gap-1"
               >
                 刷新页面获取新句子
               </button>
            </div>
          </div>
        </section>

        {/* Documentation Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Book className="w-5 h-5 text-slate-700" />
              接口文档 (API Documentation)
            </h2>
          </div>
          
          <div className="divide-y divide-slate-100">
            
            {/* API 1 */}
            <div className="p-6 md:p-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-sm font-bold">GET</span>
                /api/visitor
                <span className="text-slate-400 font-normal text-sm ml-auto">获取访客信息</span>
              </h3>
              <p className="text-slate-600 mb-4 text-sm">返回调用者的 IP 地址、国家、区域、城市、经纬度及时区信息。</p>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">返回示例 (JSON)</p>
                <pre className="text-xs text-slate-700 font-mono overflow-x-auto">
{`{
  "ip": "203.0.113.1",
  "country": "CN",
  "region": "Beijing",
  "city": "Beijing",
  "ll": [39.9, 116.4],
  "timezone": "Asia/Shanghai"
}`}
                </pre>
              </div>
            </div>

            {/* API 2 */}
            <div className="p-6 md:p-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-sm font-bold">GET</span>
                /api/hitokoto
                <span className="text-slate-400 font-normal text-sm ml-auto">获取随机一言</span>
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-slate-600 mb-3 text-sm">返回一句预设的随机名言或短句。</p>
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 bg-slate-50 uppercase">
                      <tr>
                        <th className="px-3 py-2">参数</th>
                        <th className="px-3 py-2">说明</th>
                        <th className="px-3 py-2">默认值</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="px-3 py-2 font-mono text-blue-600">c</td>
                        <td className="px-3 py-2">分类文件名 (如 anime)</td>
                        <td className="px-3 py-2 font-mono text-slate-400">default</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-mono text-blue-600">format</td>
                        <td className="px-3 py-2">返回格式 (json 或 text)</td>
                        <td className="px-3 py-2 font-mono text-slate-400">text</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">调用示例</p>
                  <div className="space-y-2">
                    <code className="block text-xs bg-white border border-slate-200 p-2 rounded text-slate-600">
                      GET /api/hitokoto?c=anime&format=json
                    </code>
                    <code className="block text-xs bg-white border border-slate-200 p-2 rounded text-slate-600">
                      GET /api/hitokoto
                    </code>
                  </div>
                </div>
              </div>
            </div>

            {/* API 3 */}
            <div className="p-6 md:p-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-sm font-bold">GET</span>
                /api/image
                <span className="text-slate-400 font-normal text-sm ml-auto">获取随机图片</span>
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-slate-600 mb-3 text-sm">返回一张随机图片的地址或直接跳转。</p>
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 bg-slate-50 uppercase">
                      <tr>
                        <th className="px-3 py-2">参数</th>
                        <th className="px-3 py-2">说明</th>
                        <th className="px-3 py-2">默认值</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="px-3 py-2 font-mono text-blue-600">c</td>
                        <td className="px-3 py-2">分类文件名 (如 nature)</td>
                        <td className="px-3 py-2 font-mono text-slate-400">default</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-mono text-blue-600">format</td>
                        <td className="px-3 py-2">返回格式 (json 或 redirect)</td>
                        <td className="px-3 py-2 font-mono text-slate-400">redirect</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">调用示例</p>
                  <div className="space-y-2">
                    <code className="block text-xs bg-white border border-slate-200 p-2 rounded text-slate-600">
                      GET /api/image?c=nature
                    </code>
                    <code className="block text-xs bg-white border border-slate-200 p-2 rounded text-slate-600">
                      GET /api/image?format=json
                    </code>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Configuration Section */}
        <section className="bg-slate-800 text-slate-300 p-6 md:p-8 rounded-2xl shadow-lg">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
            <Settings className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">系统配置说明</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                域名白名单
              </h3>
              <p className="text-sm mb-2">控制哪些域名可以调用 API。</p>
              <code className="block bg-slate-900 p-2 rounded text-xs font-mono text-emerald-400">
                /config/domain.txt
              </code>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                一言分类
              </h3>
              <p className="text-sm mb-2">添加新的 .txt 文件即可增加分类。</p>
              <code className="block bg-slate-900 p-2 rounded text-xs font-mono text-emerald-400">
                /config/hitokoto/*.txt
              </code>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                图片分类
              </h3>
              <p className="text-sm mb-2">添加新的 .txt 文件即可增加分类。</p>
              <code className="block bg-slate-900 p-2 rounded text-xs font-mono text-emerald-400">
                /config/image/*.txt
              </code>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}


