import axios from 'axios';
import { logger } from '../utils/logger';

export interface SummaryResult {
  content: string;
  keyPoints: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  category: string;
}

export class DeepSeekService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY!;
    this.apiUrl = process.env.DEEPSEEK_API_URL!;
    
    if (!this.apiKey) {
      throw new Error('DEEPSEEK_API_KEY environment variable is not set');
    }
    if (!this.apiUrl) {
      throw new Error('DEEPSEEK_API_URL environment variable is not set');
    }
    
    logger.info(`DeepSeek API initialized with key: ${this.apiKey.substring(0, 10)}...`);
  }

  async summarizeArticle(title: string, content: string): Promise<SummaryResult> {
    try {
      const prompt = this.buildSummaryPrompt(title, content);
      
      const response = await axios.post(
        this.apiUrl,
        {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的文章分析助手，擅长提取文章要点、分析情感倾向和分类文章主题。请用中文回复。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.3
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const aiResponse = response.data.choices[0].message.content;
      return this.parseSummaryResponse(aiResponse);

    } catch (error) {
      logger.error('Error calling DeepSeek API:', error);
      throw new Error(`Failed to summarize article: ${error}`);
    }
  }

  private buildSummaryPrompt(title: string, content: string): string {
    return `请分析以下微信公众号文章，并按照指定格式输出结果：

文章标题：${title}

文章内容：
${content}

请按照以下JSON格式输出分析结果：
{
  "summary": "文章的简洁摘要（150字以内）",
  "keyPoints": ["要点1", "要点2", "要点3"],
  "sentiment": "positive/negative/neutral",
  "category": "文章主要分类（如：科技、财经、生活、教育等）"
}

要求：
1. 摘要要简洁明了，突出核心内容
2. 提取3-5个关键要点
3. 准确判断文章的情感倾向
4. 给出合适的文章分类`;
  }

  private parseSummaryResponse(response: string): SummaryResult {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          content: parsed.summary || '',
          keyPoints: parsed.keyPoints || [],
          sentiment: parsed.sentiment || 'neutral',
          category: parsed.category || '未分类'
        };
      }
      
      // Fallback parsing if JSON format is not found
      return this.fallbackParsing(response);
      
    } catch (error) {
      logger.warn('Failed to parse DeepSeek response as JSON, using fallback:', error);
      return this.fallbackParsing(response);
    }
  }

  private fallbackParsing(response: string): SummaryResult {
    // Simple fallback parsing
    const lines = response.split('\n').filter(line => line.trim());
    
    return {
      content: lines.slice(0, 3).join(' ').substring(0, 200) + '...',
      keyPoints: lines.slice(0, 3),
      sentiment: 'neutral',
      category: '未分类'
    };
  }

  async batchSummarize(articles: Array<{ id: string; title: string; content: string }>): Promise<Map<string, SummaryResult>> {
    const results = new Map<string, SummaryResult>();
    
    // Process articles with rate limiting
    for (const article of articles) {
      try {
        const summary = await this.summarizeArticle(article.title, article.content);
        results.set(article.id, summary);
        
        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        logger.error(`Failed to summarize article ${article.id}:`, error);
        // Continue with other articles
      }
    }
    
    return results;
  }
}
