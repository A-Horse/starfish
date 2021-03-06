
import * as R from 'ramda';
import * as path from 'path';
import { Blog } from '../model/Blog';
import { StartFishRenderPlugin } from './interface/render-plugin';
import { Article } from '../model/Article';
import { RenderController } from '../modules/render/render-controller';

export default class StarFishRenderRecentArticle extends StartFishRenderPlugin {
  public name = 'recent-article';
  public type = 'render';

  constructor(protected options: PluginOptions, protected renderController: RenderController) {
    super(options, renderController);
  }

  public afterBlogRender(blog: Blog) {
    this.renderRecent10Articles(blog);
    this.renderRecentPagesArticles(blog);
  }

  private renderRecent10Articles(blog: Blog) {
    const articles = blog.getAllArticle();
    const recentArticles = R.compose(
      R.map(article => article.data),
      R.take(10),
      R.sort((a1: Article, a2: Article) => a2.data.createTime - a1.data.createTime)
    )(articles);

    this.renderController.writer.writeFileSync(
      path.join(this.options.rootOutputPath, 'recent-articles.json'),
      JSON.stringify(recentArticles)
    );
  }

  private renderRecentPagesArticles(blog: Blog) {
    // TODO 这里生成 articles/index.html, articles/2/index.html 属无奈之举，以后必须重构
    const recentArticlesDir = path.resolve(this.options.rootOutputPath, 'articles');
    if (!this.renderController.reader.existsSync(recentArticlesDir)) {
      this.renderController.writer.mkdirSync(recentArticlesDir);
    }

    const allArticles = blog.getAllArticle();
    const recentArticlesList: Article[][] = R.compose(
      R.splitEvery(10), // TODO 读配置
      R.map(article => article.data),
      R.sort((a1: Article, a2: Article) => a2.data.createTime - a1.data.createTime),
    )(allArticles);

    recentArticlesList.forEach((articles, index) => {
      const html = this.renderController.renderThemer.renderTemplate('CATEGORY_LIST', articles);
      if (index === 0) {
        this.renderController.writer.writeFileSync(path.join(recentArticlesDir, 'index.html'), html);
      } else {
        const dir = path.join(recentArticlesDir, (index + 1).toString())
        if (!this.renderController.reader.existsSync(dir)) {
          this.renderController.writer.mkdirSync(dir);
        }
        this.renderController.writer.writeFileSync(path.join(dir, 'index.html'), html);
      }

      this.renderController.writer.writeFileSync(
        path.join(this.options.rootOutputPath, `recent-articles-${index}.json`),
        JSON.stringify({
          pageSize: 10,
          total: allArticles.length,
          articles,
        })
      );
    });
  }
}
