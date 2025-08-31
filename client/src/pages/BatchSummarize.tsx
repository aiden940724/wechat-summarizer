import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, Link, CheckCircle, XCircle, FileText } from 'lucide-react';
import axios from 'axios';

interface BatchResult {
  url: string;
  title: string;
  summary?: {
    summary: string;
    keyPoints: string[];
    sentiment: string;
    category: string;
  };
  error?: string;
}

interface BatchResponse {
  success: boolean;
  results: BatchResult[];
  totalProcessed: number;
  successCount: number;
  failCount: number;
}

const BatchSummarize: React.FC = () => {
  const [urls, setUrls] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [stats, setStats] = useState<{total: number, success: number, fail: number} | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!urls.trim()) {
      setError('请输入至少一个微信文章链接');
      return;
    }

    // 解析URL列表
    const urlList = urls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);

    if (urlList.length === 0) {
      setError('请输入有效的URL');
      return;
    }

    if (urlList.length > 20) {
      setError('单次最多处理20个链接');
      return;
    }

    setIsProcessing(true);
    setError('');
    setResults([]);
    setStats(null);

    try {
      const response = await axios.post<BatchResponse>('/api/batch-summarize', {
        urls: urlList,
        accountName: '批量导入'
      });

      if (response.data.success) {
        setResults(response.data.results);
        setStats({
          total: response.data.totalProcessed,
          success: response.data.successCount,
          fail: response.data.failCount
        });
      } else {
        setError('批量处理失败');
      }

    } catch (err) {
      console.error('批量处理错误:', err);
      setError(axios.isAxiosError(err) && err.response?.data?.error 
        ? err.response.data.error 
        : '处理失败，请检查网络连接');
    } finally {
      setIsProcessing(false);
    }
  };

  const urlList = urls.split('\n').map(url => url.trim()).filter(url => url.length > 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold">批量微信文章总结</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            输入微信文章链接
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                微信文章链接（每行一个）
              </label>
              <Textarea
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                placeholder={`请输入微信文章链接，每行一个，例如：
https://mp.weixin.qq.com/s?__biz=xxx&mid=xxx&idx=1&sn=xxx
https://mp.weixin.qq.com/s?__biz=yyy&mid=yyy&idx=1&sn=yyy`}
                rows={8}
                className="font-mono text-sm"
              />
            </div>


            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              disabled={isProcessing || urlList.length === 0}
              className="w-full sm:w-auto"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  处理中...
                </>
              ) : (
                `开始处理 ${urlList.length} 个链接`
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>处理结果统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-gray-600">总计</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.success}</div>
                <div className="text-sm text-gray-600">成功</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.fail}</div>
                <div className="text-sm text-gray-600">失败</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">处理结果</h2>
          {results.map((result, index) => (
            <Card key={index} className={result.error ? 'border-red-200' : 'border-green-200'}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  {result.error ? (
                    <XCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  )}
                  
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="font-medium text-lg">{result.title}</h3>
                      <a 
                        href={result.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline break-all"
                      >
                        {result.url}
                      </a>
                    </div>

                    {result.error ? (
                      <div className="text-red-600 text-sm">
                        错误: {result.error}
                      </div>
                    ) : result.summary && (
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-sm text-gray-700 mb-1">摘要</h4>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {result.summary.summary}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-sm text-gray-700 mb-1">关键点</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {result.summary.keyPoints.map((point, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="flex gap-4 text-sm">
                          <span className="text-gray-600">
                            <strong>情感:</strong> {result.summary.sentiment}
                          </span>
                          <span className="text-gray-600">
                            <strong>分类:</strong> {result.summary.category}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BatchSummarize;
