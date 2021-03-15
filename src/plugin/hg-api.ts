import * as fs from 'fs';
import * as path from 'path';
import * as R from 'ramda';
import { CategoryList } from '../model/CategoryList';
import { Category } from '../model/Category';
import { Article } from '../model/Article';
import { StartFishRenderPlugin } from './interface/render-plugin';
import { Blog } from '../model/Blog';
import { RenderController } from '../modules/render/render-controller';

export default class StarflishRenderHgApiPlugin extends StartFishRenderPlugin {
  public name = 'hg-api';
  public type = 'render';
  private allCategories = [];

  constructor(protected options: PluginOptions, protected renderController: RenderController) {
    super(options, renderController);
  }

  public afterArticleRender(renderedHtml: string, article: Article): void {
    const articleData: ArticleData = article.getData();
    const outputDirPath = path.join(this.options.rootOutputPath, articleData.dirPath);
    const outputFilePath = 'index.json';
    fs.writeFileSync(path.join(outputDirPath, outputFilePath), JSON.stringify(articleData));
  }

  public afterCategoryListRender(renderedHtml: string, categoryList: CategoryList): void {
    const categoryListData: CategoryListData = categoryList.getData();
    const categoryListOutputDirPath = path.join(this.options.rootOutputPath, categoryListData.path);

    if (!fs.existsSync(categoryListOutputDirPath)) {
      fs.mkdirSync(categoryListOutputDirPath);
    }
    fs.writeFileSync(path.join(categoryListOutputDirPath, 'index.json'), JSON.stringify(categoryListData));
  }


  public afterArchiveRender(renderedHtml: string, archive: CategoryList): void {
    const archiveData: CategoryListData = archive.getData();
    const categoryListOutputDirPath = path.join(this.options.rootOutputPath, archiveData.path);

    if (!fs.existsSync(categoryListOutputDirPath)) {
      fs.mkdirSync(categoryListOutputDirPath);
    }
    fs.writeFileSync(path.join(categoryListOutputDirPath, 'index.json'), JSON.stringify(archiveData));
  }

  public afterCategoryRender(renderedHtml: string, category: Category): void {
    const categoryData = category.getData();
    this.allCategories.push(categoryData);
    fs.writeFileSync(
      path.join(this.options.rootOutputPath, categoryData.path, 'index.json'),
      JSON.stringify(categoryData)
    );
  }

  public afterBlogRender(blog: Blog): void {
    this.writeAllCategory();

    const articlesOutputDirPath = path.join(this.options.rootOutputPath, this.options.blogConfigure.BLOG.ARTICLES_DIR);

    if (!fs.existsSync(articlesOutputDirPath)) {
      fs.mkdirSync(articlesOutputDirPath);
    }

    const pageSize = 20;
    const articles = blog.getAllArticle();
    const pageNumber = Math.round(articles.length / pageSize);

    const sortedArticles = R.compose(R.sort((a1: Article, a2: Article) => a2.data.createTime - a1.data.createTime))(
      articles
    );

    R.splitEvery(pageSize, sortedArticles).map((articleSpited, index) => {
      const articlePage = {
        articles: articleSpited.map((a: Article) => a.getData()),
        pageIndex: index,
        pageNumber,
        pageSize
      };
      fs.writeFileSync(path.join(articlesOutputDirPath, `articles-${index}.json`), JSON.stringify(articlePage));
    });
  }

  private writeAllCategory() {
    fs.writeFileSync(path.join(this.options.rootOutputPath, 'all-category.json'), JSON.stringify(this.allCategories));
  }
}
