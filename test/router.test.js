const path = require('path')
const router = require('../src/router')

const testAppRoot = './test-app/api'
const testAppAbsPath = path.resolve(__dirname,'../',testAppRoot)

describe('lets try the router', () => {
  test('findAllFiles recurses properly', () => {
    let expected = [
      '/index.js',
      'pets/:id/photos/:photo_id.js',
      '/pets/:id.js',
      '/pets/index.js'
    ].map((e) => {return path.join(testAppAbsPath,e)})
    expect(router.findAllFiles(testAppAbsPath)).toStrictEqual(expected)
  })
})

describe.each`
    fileName                | regex                        | reqPath
    ${'/index.js'}          | ${/^\/$/}                    | ${'/'}
    ${'/redirect.js'}       | ${/^\/redirect$/}            | ${'/redirect'}
    ${'/404.html'}          | ${/^\/404.html$/}            | ${'/404.html'}
    ${'/pets/index.js'}     | ${/^\/pets\/$/}              | ${'/pets/'}
    ${'/pets/:pet_name.js'} | ${/^\/pets\/(?<pet_name>[A-Za-z0-9_-]+)$/} | ${'/pets/Lassy_Lasater'}
    ${'/pets/:id/index.js'} | ${/^\/pets\/(?<id>[A-Za-z0-9_-]+)\/$/} | ${'/pets/123-abc/'}
`('With fileName=$fileName regex=$regex reqPath=$reqPath', ({fileName, regex, reqPath}) => {
    it('fileName should convert to correct regex', () => {
        expect(router.nameToRegex(fileName)).toStrictEqual(regex);
    })
    it('reqPath should match regex', () => {
      expect(reqPath.match(regex)[0]).toStrictEqual(reqPath);
  })
})

describe('generate routes for src', () => {
  test('it should return array of routes', () => {
    expected = [
      {
        handlerPath: `${testAppAbsPath}/index.js`,
        regex: /^\/$/
      },
      {
        handlerPath: `${testAppAbsPath}/pets/:id/photos/:photo_id.js`,
        regex: /^\/pets\/(?<id>[A-Za-z0-9_-]+)\/photos\/(?<photo_id>[A-Za-z0-9_-]+)$/
      },
      {
        handlerPath: `${testAppAbsPath}/pets/:id.js`,
        regex: /^\/pets\/(?<id>[A-Za-z0-9_-]+)$/
      },
      {
        handlerPath: `${testAppAbsPath}/pets/index.js`,
        regex: /^\/pets\/$/
      }
    ]
    expect(router.generateRoutes(testAppAbsPath)).toMatchObject(expected)

  })
})

describe('resolve correct handlers for routes', () => {
  test('it resolves index.js handler for /', () => {
    router.resolveHandler({path: '/'},testAppRoot)
  })
  test('it runs index.js:get() for `GET /`', () => {
    handler = router.resolveHandler({path: '/'},testAppRoot)
    router.handle(handler,{path:'/',method:'GET',headers:{'Accept':'*/*'}},{headers:{}})
  })
  test('it runs index.js:all() for `POST /`', () => {
    handler = router.resolveHandler({path: '/'},testAppRoot)
    router.handle(handler,{path:'/',method:'POST',headers:{'Accept':'*/*'}},{headers:{}})
  })
  test('it grabs path based variables and places then in the req.params', () => {
    req = {path: '/pets/1234/photos/abc-xyz', params: {blah: 'smah'}}
    hander = router.resolveHandler(req,testAppRoot)
    expect(req.params).toMatchObject({id: '1234', photo_id: 'abc-xyz'})
  })
})
