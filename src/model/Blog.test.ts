jest.mock('../modules/render/render-themer');
jest.mock('../modules/render/render-plugin');
jest.mock('./Category');

import { Blog } from './Blog';
import { RenderController } from '../modules/render/render-controller';
import { FSReader } from '../modules/reader/FSReader';
import { Category } from './Category';
import { FSWriter } from '../modules/writer/FSWriter';

test('Blog load func', () => {
  const blogInputPath = '';
  const blogOutputPath = '';
  const blogConfigure = {
    BLOG: {
      ARTICLES_DIR: 'articles'
    }
  } as BlogConfigure;

  const reader = new FSReader();
  const writer = new FSWriter();

  jest.spyOn(reader, 'readCategoryPaths').mockImplementation(() => {
    return ['/d/1', '/d/2'];
  });

  const renderController = new RenderController('', '', {} as BlogConfigure, reader, writer);
  const blog = new Blog({ blogInputPath, blogOutputPath, blogConfigure }, renderController);

  blog.load();

  expect((<any>blog).categoryList).toBeDefined();
  expect((<any>blog).blogHome).toBeDefined();
  expect((<any>blog).categorys).toBeDefined();
  (<any>blog).categorys.forEach((c: Category) => {
    expect(c.load).toBeCalled();
  });
});
