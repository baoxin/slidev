
import { resolve } from 'path'
import { Plugin } from 'vite'
import Vue from '@vitejs/plugin-vue'
import ViteIcons, { ViteIconsResolver } from 'vite-plugin-icons'
import ViteComponents from 'vite-plugin-components'
import Markdown from 'vite-plugin-md'
import WindiCSS, { defaultConfigureFiles } from 'vite-plugin-windicss'
import Prism from 'markdown-it-prism'
import RemoteAssets from 'vite-plugin-remote-assets'
import { createConfigPlugin } from './config'
import { createSlidesLoader } from './slides'
import { createMonacoLoader, transformMarkdownMonaco } from './monaco'
import { createEntryPlugin } from './entry'
import { resolveOptions, SlidevPluginOptions } from './options'
import { createSetupPlugin } from './setups'
import VitePluginVueFactory, { VueFactoryResolver } from './factory'
import VitePluginServerRef from './server-ref'

export function ViteSlidevPlugin(options: SlidevPluginOptions = {}): Plugin[] {
  const {
    vue: vueOptions = {},
    markdown: mdOptions = {},
    components: componentsOptions = {},
    icons: iconsOptions = {},
    remoteAssets: remoteAssetsOptions = {},
    windicss: windiOptions = {},
  } = options

  const slidesOptions = resolveOptions()
  const { themeRoot, clientRoot } = slidesOptions

  return [
    Vue({
      include: [/\.vue$/, /\.md$/],
      ...vueOptions,
    }),

    Markdown({
      wrapperClasses: '',
      headEnabled: true,
      markdownItOptions: {
        quotes: '""\'\'',
        html: true,
        xhtmlOut: true,
        linkify: true,
      },
      markdownItSetup(md) {
        md.use(Prism)
      },
      transforms: {
        before: transformMarkdownMonaco,
      },
      ...mdOptions,
    }),

    {
      name: 'slidev:vue-escape',
      enforce: 'post',
      transform(code, id) {
        if (id.endsWith('.md'))
          return code.replace(/\\{/g, '{')
      },
    } as Plugin,

    ViteComponents({
      extensions: ['vue', 'md', 'ts'],

      dirs: [
        `${clientRoot}/builtin`,
        `${clientRoot}/components`,
        `${themeRoot}/components`,
        'src/components',
        'components',
      ],

      customLoaderMatcher: id => id.endsWith('.md'),

      customComponentResolvers: [
        ViteIconsResolver({
          componentPrefix: '',
        }),
        VueFactoryResolver,
      ],

      ...componentsOptions,
    }),

    ViteIcons({
      ...iconsOptions,
    }),

    WindiCSS(
      {
        configFiles: [
          ...defaultConfigureFiles,
          resolve(themeRoot, 'windi.config.ts'),
          resolve(clientRoot, 'windi.config.ts'),
        ],
        ...windiOptions,
      },
      {
        hookOptions: {
          ignoreNodeModules: false,
        },
      },
    ),

    RemoteAssets({
      ...remoteAssetsOptions,
    }),

    VitePluginVueFactory(),
    VitePluginServerRef({
      dataMap: {
        sync: false,
        state: {
          page: 0,
          tab: 0,
        },
      },
    }),
    createConfigPlugin(slidesOptions),
    createEntryPlugin(slidesOptions),
    createSlidesLoader(slidesOptions),
    createSetupPlugin(slidesOptions),
    createMonacoLoader(),
  ].flat()
}
