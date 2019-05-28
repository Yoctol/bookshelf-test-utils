# bookshelf-test-utils

```js
import '@yoctol/bookshelf-test-utils/extend-expect';
```

```js
await expect(User).toHasInDatabase({
  name: 'user name',
});
```

```js
import { refreshDatabase } from '@yoctol/bookshelf-test-utils';

afterEach(refreshDatabase);
```
