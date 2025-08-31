import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { WeChatUrlExtractorService } from '../services/WeChatUrlExtractorService';
import { DeepSeekService } from '../services/DeepSeekService';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();
const urlExtractor = new WeChatUrlExtractorService();
const deepSeekService = new DeepSeekService();

interface BatchSummarizeRequest {
  urls: string[];
  accountName?: string;
}

interface BatchSummarizeResponse {
  success: boolean;
  results: Array<{
    url: string;
    title: string;
    summary?: {
      summary: string;
      keyPoints: string[];
      sentiment: string;
      category: string;
    };
    error?: string;
  }>;
  totalProcessed: number;
  successCount: number;
  failCount: number;
}

/**
 * POST /api/batch-summarize
 * 批量总结微信文章
 */
router.post('/', async (req, res) => {
  try {
    const { urls, accountName = '批量导入' }: BatchSummarizeRequest = req.body;

    // 验证输入
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        success: false,
        error: '请提供有效的URL数组'
      });
    }

    if (urls.length > 20) {
      return res.status(400).json({
        success: false,
        error: '单次最多处理20个URL'
      });
    }

    logger.info(`开始批量处理 ${urls.length} 个微信文章URL`);

    // 第一步：提取文章内容
    const extractedArticles = await urlExtractor.extractBatchWeChatArticles(urls);
    
    // 第二步：对成功提取的文章进行AI总结
    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const article of extractedArticles) {
      if (article.error) {
        results.push({
          url: article.url,
          title: article.title,
          error: article.error
        });
        failCount++;
        continue;
      }

      try {
        // 使用DeepSeek进行总结
        const summaryResult = await deepSeekService.summarizeArticle(
          article.title,
          article.content
        );

        // 查找或创建账户
        const account = await prisma.weChatAccount.upsert({
          where: { name: accountName },
          update: {},
          create: {
            name: accountName,
            displayName: accountName,
            description: '通过批量URL导入创建'
          }
        });

        // 保存文章到数据库（如果URL已存在则更新）
        const savedArticle = await prisma.article.upsert({
          where: { url: article.url },
          update: {
            title: article.title,
            content: article.content,
            publishDate: article.publishDate || new Date(),
            author: article.author || accountName,
            accountId: account.id
          },
          create: {
            title: article.title,
            content: article.content,
            url: article.url,
            publishDate: article.publishDate || new Date(),
            author: article.author || accountName,
            accountId: account.id
          }
        });

        // 保存总结到数据库（如果已存在则更新）
        await prisma.summary.upsert({
          where: { articleId: savedArticle.id },
          update: {
            content: summaryResult.content,
            keyPoints: JSON.stringify(summaryResult.keyPoints),
            sentiment: summaryResult.sentiment,
            category: summaryResult.category
          },
          create: {
            articleId: savedArticle.id,
            content: summaryResult.content,
            keyPoints: JSON.stringify(summaryResult.keyPoints),
            sentiment: summaryResult.sentiment,
            category: summaryResult.category
          }
        });

        results.push({
          url: article.url,
          title: article.title,
          summary: {
            summary: summaryResult.content,
            keyPoints: summaryResult.keyPoints,
            sentiment: summaryResult.sentiment,
            category: summaryResult.category
          }
        });

        successCount++;
        logger.info(`成功处理文章: ${article.title}`);

      } catch (error) {
        logger.error(`总结文章失败 ${article.url}:`, error);
        results.push({
          url: article.url,
          title: article.title,
          error: `总结失败: ${error instanceof Error ? error.message : '未知错误'}`
        });
        failCount++;
      }

      // 添加延迟避免API限制
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const response: BatchSummarizeResponse = {
      success: true,
      results,
      totalProcessed: urls.length,
      successCount,
      failCount
    };

    logger.info(`批量处理完成，成功: ${successCount}，失败: ${failCount}`);
    res.json(response);

  } catch (error) {
    logger.error('批量总结处理失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误'
    });
  }
});

/**
 * GET /api/batch-summarize/history
 * 获取批量处理历史
 */
router.get('/history', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where: {
          account: {
            name: '批量导入'
          }
        },
        include: {
          summary: true,
          account: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.article.count({
        where: {
          account: {
            name: '批量导入'
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: articles.map(article => ({
        id: article.id,
        title: article.title,
        url: article.url,
        author: article.author,
        publishDate: article.publishDate,
        createdAt: article.createdAt,
        summary: article.summary ? {
          summary: article.summary.content,
          keyPoints: JSON.parse(article.summary.keyPoints),
          sentiment: article.summary.sentiment,
          category: article.summary.category
        } : null
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('获取批量处理历史失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误'
    });
  }
});

export default router;
