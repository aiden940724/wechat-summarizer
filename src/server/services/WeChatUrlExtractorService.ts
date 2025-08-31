import axios from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '../utils/logger';

export interface ExtractedWeChatArticle {
  url: string;
  title: string;
  content: string;
  author?: string;
  publishDate?: Date;
  error?: string;
}

export class WeChatUrlExtractorService {
  private readonly timeout = 20000; // 20秒超时，微信文章加载较慢
  private readonly maxContentLength = 15000; // 微信文章通常较长

  /**
   * 批量提取微信文章内容
   */
  async extractBatchWeChatArticles(urls: string[]): Promise<ExtractedWeChatArticle[]> {
    logger.info(`开始批量提取 ${urls.length} 个微信文章`);
    
    // 验证所有URL都是微信文章
    const validUrls = urls.filter(url => this.isWeChatArticleUrl(url));
    const invalidUrls = urls.filter(url => !this.isWeChatArticleUrl(url));
    
    if (invalidUrls.length > 0) {
      logger.warn(`发现 ${invalidUrls.length} 个非微信文章URL:`, invalidUrls);
    }
    
    const results: ExtractedWeChatArticle[] = [];
    
    // 为无效URL添加错误结果
    invalidUrls.forEach(url => {
      results.push({
        url,
        title: '无效链接',
        content: '',
        error: '不是有效的微信文章链接'
      });
    });
    
    // 并发处理有效URL，限制并发数量避免被微信限制
    const concurrencyLimit = 2; // 微信限制较严，减少并发数
    for (let i = 0; i < validUrls.length; i += concurrencyLimit) {
      const batch = validUrls.slice(i, i + concurrencyLimit);
      const batchPromises = batch.map(url => this.extractSingleWeChatArticle(url));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            url: batch[index],
            title: '提取失败',
            content: '',
            error: result.reason?.message || '未知错误'
          });
        }
      });
      
      // 批次间添加较长延迟，避免被微信反爬虫机制限制
      if (i + concurrencyLimit < validUrls.length) {
        await this.delay(3000); // 3秒延迟
      }
    }
    
    const successCount = results.filter(r => !r.error).length;
    const failCount = results.filter(r => r.error).length;
    logger.info(`批量提取完成，成功: ${successCount}，失败: ${failCount}`);
    
    return results;
  }

  /**
   * 提取单个微信文章内容
   */
  async extractSingleWeChatArticle(url: string): Promise<ExtractedWeChatArticle> {
    try {
      logger.info(`提取微信文章: ${url}`);
      
      // 发送HTTP请求，模拟真实浏览器
      const response = await axios.get(url, {
        timeout: this.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Referer': 'https://mp.weixin.qq.com/',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin'
        },
        maxRedirects: 5
      });

      // 解析微信文章HTML
      const $ = cheerio.load(response.data);
      
      // 提取标题
      const title = this.extractTitle($);
      
      // 提取作者
      const author = this.extractAuthor($);
      
      // 提取发布时间
      const publishDate = this.extractPublishDate($);
      
      // 提取正文内容
      const content = this.extractContent($);
      
      if (!content || content.length < 50) {
        throw new Error('文章内容提取失败或内容过短');
      }

      return {
        url,
        title: title || '无标题',
        content: this.cleanContent(content),
        author,
        publishDate
      };

    } catch (error) {
      logger.error(`提取微信文章失败 ${url}:`, error);
      return {
        url,
        title: '提取失败',
        content: '',
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 验证是否为微信文章URL
   */
  private isWeChatArticleUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const isValid = urlObj.hostname === 'mp.weixin.qq.com' && 
                     urlObj.pathname.startsWith('/s/');
      
      logger.info(`URL验证: ${url}`);
      logger.info(`  - hostname: ${urlObj.hostname} (期望: mp.weixin.qq.com)`);
      logger.info(`  - pathname: ${urlObj.pathname} (期望: /s/*)`);
      logger.info(`  - 验证结果: ${isValid}`);
      
      return isValid;
    } catch (error) {
      logger.error(`URL解析失败: ${url}`, error);
      return false;
    }
  }

  /**
   * 提取文章标题
   */
  private extractTitle($: cheerio.CheerioAPI): string {
    // 微信文章标题的多种可能选择器
    const titleSelectors = [
      '#activity-name',
      '.rich_media_title',
      'h1.rich_media_title',
      '.weui-article__title',
      'h1'
    ];

    for (const selector of titleSelectors) {
      const title = $(selector).first().text().trim();
      if (title) {
        return title;
      }
    }

    return '';
  }

  /**
   * 提取作者信息
   */
  private extractAuthor($: cheerio.CheerioAPI): string {
    const authorSelectors = [
      '.rich_media_meta_text',
      '.profile_nickname',
      '#js_name',
      '.weui-article__author'
    ];

    for (const selector of authorSelectors) {
      const author = $(selector).first().text().trim();
      if (author) {
        return author;
      }
    }

    return '';
  }

  /**
   * 提取发布时间
   */
  private extractPublishDate($: cheerio.CheerioAPI): Date | undefined {
    const dateSelectors = [
      '#publish_time',
      '.rich_media_meta_text',
      '.weui-article__time'
    ];

    for (const selector of dateSelectors) {
      const dateText = $(selector).first().text().trim();
      if (dateText) {
        const date = this.parseChineseDate(dateText);
        if (date) {
          return date;
        }
      }
    }

    return undefined;
  }

  /**
   * 提取文章正文内容
   */
  private extractContent($: cheerio.CheerioAPI): string {
    // 微信文章内容的选择器
    const contentSelectors = [
      '#js_content',
      '.rich_media_content',
      '.weui-article__bd'
    ];

    for (const selector of contentSelectors) {
      const contentElement = $(selector).first();
      if (contentElement.length > 0) {
        // 移除不需要的元素
        contentElement.find('script, style, .rich_media_tool, .qr_code_pc_outer').remove();
        
        // 提取纯文本，保留段落结构
        let content = '';
        contentElement.find('p, div, section').each((_, elem) => {
          const text = $(elem).text().trim();
          if (text && text.length > 10) { // 过滤掉太短的内容
            content += text + '\n\n';
          }
        });
        
        // 如果段落提取失败，直接提取所有文本
        if (!content) {
          content = contentElement.text().trim();
        }
        
        return content;
      }
    }

    return '';
  }

  /**
   * 解析中文日期格式
   */
  private parseChineseDate(dateStr: string): Date | undefined {
    try {
      // 匹配常见的中文日期格式
      const patterns = [
        /(\d{4})年(\d{1,2})月(\d{1,2})日/,
        /(\d{4})-(\d{1,2})-(\d{1,2})/,
        /(\d{1,2})月(\d{1,2})日/
      ];

      for (const pattern of patterns) {
        const match = dateStr.match(pattern);
        if (match) {
          if (match.length === 4) {
            // 完整日期
            return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
          } else if (match.length === 3) {
            // 只有月日，使用当前年份
            const currentYear = new Date().getFullYear();
            return new Date(currentYear, parseInt(match[1]) - 1, parseInt(match[2]));
          }
        }
      }
    } catch (error) {
      logger.warn('日期解析失败:', dateStr, error);
    }
    
    return undefined;
  }

  /**
   * 清理文章内容
   */
  private cleanContent(content: string): string {
    return content
      .replace(/\s+/g, ' ') // 合并多个空白字符
      .replace(/\n\s*\n/g, '\n\n') // 规范化段落分隔
      .trim()
      .substring(0, this.maxContentLength); // 限制长度
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
