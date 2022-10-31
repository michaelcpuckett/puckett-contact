import React, { ReactElement } from 'react';
import { AP } from 'activitypub-core-types';
import { getId, isTypeOf, isType } from 'activitypub-core-utilities';
import { OutboxPage } from './OutboxPage';
import { ActorEntityPage } from './ActorEntityPage';
import { ArticleEntityPage } from './ArticleEntityPage';
import { CollectionEntityPage } from './CollectionEntityPage';

export function EntityPage({ entity, actor: user }: { entity: AP.Entity; actor?: AP.Actor; }) {
  if (isTypeOf(entity, AP.ActorTypes)) {
    return <ActorEntityPage actor={entity as AP.Actor} user={user} />;
  }

  if (isType(entity, AP.CollectionTypes.COLLECTION)) {
    return <CollectionEntityPage collection={entity as AP.Collection} user={user} />;
  }

  if (isType(entity, AP.CollectionTypes.ORDERED_COLLECTION)) {
    return <CollectionEntityPage collection={entity as AP.OrderedCollection} user={user} />;
  }

  if (isType(entity, AP.ExtendedObjectTypes.ARTICLE)) {
    return <ArticleEntityPage article={entity as AP.Article} user={user} />;
  }

  return (
    <html lang="en">
      <head>
        <title>ActivityPub - Entity</title>
        <link rel="stylesheet" href="/EntityPage.css" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <main>
          <Entity headingLevel={1} entity={entity} user={user} />
          <textarea defaultValue={JSON.stringify(entity)}></textarea>
        </main>
      </body>
    </html>
  );
};

function Entity({ headingLevel, entity, user }: { entity: AP.Entity; user?: AP.Actor; headingLevel: number; }) {
  if (isTypeOf(entity, AP.ActivityTypes)) {
    return <ActivityEntity headingLevel={headingLevel} activity={entity as AP.Activity} user={user} />;
  }

  if (isType(entity, AP.CollectionTypes.COLLECTION)) {
    return <CollectionEntity headingLevel={headingLevel} collection={entity as AP.Collection} user={user} />;
  }

  if (isType(entity, AP.CollectionTypes.ORDERED_COLLECTION)) {
    if (entity.name === 'Outbox') {
      return <OutboxPage headingLevel={headingLevel} collection={entity as AP.OrderedCollection} user={user} />;
    }

    return <OrderedCollectionEntity headingLevel={headingLevel} collection={entity as AP.OrderedCollection} user={user} />;
  }

  if (isTypeOf(entity, AP.ExtendedObjectTypes)) {
    return <ExtendedObjectEntity headingLevel={headingLevel} extendedObject={entity as AP.ExtendedObject} user={user} />;
  }

  return <></>;
}

function ExtendedObjectEntity({ headingLevel, extendedObject, user }: { extendedObject: AP.ExtendedObject; user?: AP.Actor; headingLevel: number;  }) {
  return (
    <div className="card">
      <div role="heading" aria-level={headingLevel}>
        A(n) {extendedObject.type}.
        {extendedObject.type === 'Image' ? <img src={extendedObject.url.toString() ?? ''} /> : null}
      </div>
    </div>
  )
}

function CollectionEntity({ headingLevel, collection, user }: { collection: AP.Collection, user?: AP.Actor; headingLevel: number; }) {
  if (!('items' in collection) || !Array.isArray(collection.items)) {
    return <></>
  }

  return (
    <ul>
      {collection.items.map(item => {
        if (item instanceof URL) {
          return <></>;
        }

        return <Entity headingLevel={headingLevel + 1} entity={item} user={user} />
      })}
    </ul>
  )
}

function OrderedCollectionEntity({ headingLevel, collection, user }: { collection: AP.OrderedCollection, user?: AP.Actor; headingLevel: number; }) {
  if (!('orderedItems' in collection) || !Array.isArray(collection.orderedItems)) {
    return <></>
  }

  return (
    <ul>
      {collection.orderedItems.map(item => {
        if (item instanceof URL) {
          return <></>;
        }

        return <Entity headingLevel={headingLevel + 1} entity={item} user={user} />
      })}
    </ul>
  )
}

function ActivityEntity({ headingLevel, activity, user }: { activity: AP.Activity; user?: AP.Actor; headingLevel: number; }) {
  return <>An Activity.</>
}

function ArticleEntity({ article }: { article: AP.Article }) {
  return <>
    <h1>
      {article.summary}
    </h1>
    <p>{article.published.toString()}</p>
    <p>{article.attributedTo.toString()}</p>
    {article.content}
  </>
}