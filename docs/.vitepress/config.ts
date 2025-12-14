import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'V2Board 文档',
  description: 'V2Board 运行问题处理方案与技术文档',

  // 主题配置
  themeConfig: {
    // 网站logo
    logo: '/logo.svg',

    // 导航栏
    nav: [
      { text: '首页', link: '/' },
      { text: '快速开始', link: '/guide/getting-started' },
      { text: '故障排除', link: '/troubleshooting/' },
      { text: 'FAQ', link: '/faq/' }
    ],

    // 侧边栏
    sidebar: {
      '/guide/': [
        {
          text: '指南',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '系统要求', link: '/guide/requirements' },
            { text: '安装部署', link: '/guide/installation' },
            { text: '配置说明', link: '/guide/configuration' }
          ]
        }
      ],
      '/troubleshooting/': [
        {
          text: '故障排除',
          items: [
            { text: '概述', link: '/troubleshooting/' },
            { text: '安装问题', link: '/troubleshooting/installation' },
            { text: '数据库问题', link: '/troubleshooting/database' },
            { text: '性能问题', link: '/troubleshooting/performance' },
            { text: '网络问题', link: '/troubleshooting/network' },
            { text: '权限问题', link: '/troubleshooting/permissions' }
          ]
        }
      ],
      '/faq/': [
        {
          text: '常见问题',
          items: [
            { text: 'FAQ', link: '/faq/' },
            { text: '支付相关', link: '/faq/payment' },
            { text: '节点相关', link: '/faq/nodes' },
            { text: '用户管理', link: '/faq/users' }
          ]
        }
      ]
    },

    // 社交链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/v2board/v2board' }
    ],

    // 页脚
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present V2Board Documentation'
    },

    // 搜索
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档'
          },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换'
            }
          }
        }
      }
    },

    // 编辑链接
    editLink: {
      pattern: 'https://github.com/yourusername/v2board-docs/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页'
    },

    // 最后更新时间
    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium'
      }
    },

    // 文档页脚
    docFooter: {
      prev: '上一页',
      next: '下一页'
    },

    // 大纲
    outline: {
      label: '页面导航',
      level: [2, 3]
    },

    // 返回顶部
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式'
  },

  // 语言设置
  lang: 'zh-CN',

  // Head 配置
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }]
  ],

  // Markdown 配置
  markdown: {
    lineNumbers: true,
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    }
  }
})
