/**
 * ESLint 配置文件
 * 使用 airbnb-base 作为基础规则集
 */
module.exports = {
  env: {
    node: true,
    commonjs: true,
    es2021: true,
    jest: true
  },
  extends: [
    'airbnb-base'
  ],
  overrides: [
    {
      env: {
        node: true
      },
      files: ['.eslintrc.{js,cjs}'],
      parserOptions: {
        sourceType: 'script'
      }
    }
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
    // 允许使用 console.log
    'no-console': 'off',
    // 允许使用 process.env
    'no-process-env': 'off',
    // 允许使用 __dirname 和 __filename
    'no-path-concat': 'off',
    // 允许使用 async/await
    'require-await': 'error',
    // 允许使用箭头函数
    'prefer-arrow-callback': ['error', {
      allowNamedFunctions: true
    }],
    // 允许使用解构赋值
    'prefer-destructuring': ['error', {
      VariableDeclarator: {
        array: true,
        object: true
      },
      AssignmentExpression: {
        array: false,
        object: false
      }
    }],
    // 允许使用模板字符串
    'prefer-template': 'error',
    // 允许使用 rest 参数
    'prefer-rest-params': 'error',
    // 允许使用扩展运算符
    'prefer-spread': 'error',
    // 允许使用短路赋值
    'no-unneeded-ternary': ['error', {
      defaultAssignment: true
    }],
    // 允许使用单行 if 语句
    'curly': ['error', 'multi-or-nest', 'consistent'],
    // 允许使用 ++ 和 --
    'no-plusplus': 'off',
    // 允许使用 for 循环
    'no-restricted-syntax': 'off',
    // 允许使用 let 和 const
    'no-var': 'error',
    // 允许使用 const
    'prefer-const': 'error',
    // 允许使用 ... 运算符
    'object-shorthand': ['error', 'always', {
      avoidQuotes: true,
      avoidExplicitReturnArrows: true
    }],
    // 允许使用 Promise
    'promise/always-return': 'error',
    'promise/no-return-wrap': 'error',
    'promise/param-names': 'error',
    'promise/catch-or-return': 'error',
    'promise/no-native': 'off',
    'promise/no-nesting': 'warn',
    'promise/no-promise-in-callback': 'warn',
    'promise/no-callback-in-promise': 'warn',
    'promise/avoid-new': 'off',
    'promise/no-new-statics': 'error',
    'promise/no-return-in-finally': 'warn',
    'promise/valid-params': 'warn',
    // 允许使用 async/await
    'no-await-in-loop': 'warn',
    // 允许使用 try/catch
    'no-empty': ['error', {
      allowEmptyCatch: true
    }],
    // 允许使用 == 和 !=
    'eqeqeq': ['error', 'smart'],
    // 允许使用 delete
    'no-delete-var': 'error',
    // 允许使用 typeof
    'valid-typeof': 'error',
    // 允许使用括号
    'space-before-blocks': 'error',
    'space-in-parens': 'error',
    'space-infix-ops': 'error',
    'space-unary-ops': 'error',
    'spaced-comment': 'error',
    // 允许使用缩进
    'indent': ['error', 2, {
      SwitchCase: 1
    }],
    // 允许使用分号
    'semi': ['error', 'always'],
    // 允许使用单引号
    'quotes': ['error', 'single', {
      avoidEscape: true,
      allowTemplateLiterals: true
    }],
    // 允许使用逗号
    'comma-dangle': ['error', 'always-multiline'],
    // 允许使用大括号
    'brace-style': ['error', '1tbs', {
      allowSingleLine: true
    }],
    // 允许使用冒号
    'key-spacing': ['error', {
      beforeColon: false,
      afterColon: true
    }],
    // 允许使用空格
    'keyword-spacing': 'error',
    'no-multi-spaces': 'error',
    'no-trailing-spaces': 'error',
    'padded-blocks': ['error', 'never'],
    'space-before-function-paren': ['error', {
      anonymous: 'always',
      named: 'never',
      asyncArrow: 'always'
    }],
    // 允许使用换行
    'linebreak-style': ['error', 'unix'],
    // 允许使用空行
    'no-multiple-empty-lines': ['error', {
      max: 1,
      maxEOF: 1,
      maxBOF: 0
    }],
    // 允许使用注释
    'no-inline-comments': 'off',
    'no-warning-comments': 'warn',
    // 允许使用变量
    'no-unused-vars': ['error', {
      vars: 'all',
      args: 'after-used',
      ignoreRestSiblings: true
    }],
    // 允许使用函数
    'func-style': ['error', 'expression', {
      allowArrowFunctions: true
    }],
    // 允许使用对象
    'object-curly-spacing': ['error', 'always'],
    'object-curly-newline': ['error', {
      ObjectExpression: {
        minProperties: 4,
        multiline: true,
        consistent: true
      },
      ObjectPattern: {
        minProperties: 4,
        multiline: true,
        consistent: true
      }
    }],
    // 允许使用数组
    'array-bracket-spacing': ['error', 'always'],
    'array-bracket-newline': ['error', {
      multiline: true,
      minItems: 4
    }],
    // 允许使用导入
    'import/extensions': ['error', 'always', {
      js: 'always'
    }],
    'import/newline-after-import': ['error', {
      count: 1
    }],
    'import/no-extraneous-dependencies': ['error', {
      devDependencies: true,
      optionalDependencies: false,
      peerDependencies: false
    }],
    'import/no-unresolved': 'off',
    'import/no-dynamic-require': 'off',
    'import/prefer-default-export': 'off',
    'import/order': ['error', {
      'groups': [
        ['builtin', 'external'],
        'internal',
        ['parent', 'sibling', 'index']
      ],
      'newlines-between': 'always',
      'alphabetize': {
        order: 'asc',
        caseInsensitive: true
      }
    }]
  }
};
