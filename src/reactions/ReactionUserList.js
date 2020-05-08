/* @flow strict-local */
import React, { PureComponent } from 'react';
import { FlatList } from 'react-native';
import { connect } from '../react-redux';

import type { Dispatch, UserOrBot } from '../types';
import UserItem from '../users/UserItem';
import { navigateToAccountDetails } from '../actions';

type Props = $ReadOnly<{|
  dispatch: Dispatch,
  reactedUserIds: $ReadOnlyArray<number>,
  allUsersById: Map<number, UserOrBot>,
|}>;

/**
 * Component showing who made a given reaction on a given message.
 *
 * Used within `MessageReactionList`.
 */
class ReactionUserList extends PureComponent<Props> {
  handlePress = (userId: number) => {
    const { dispatch } = this.props;
    dispatch(navigateToAccountDetails(userId));
  };

  render() {
    const { reactedUserIds, allUsersById } = this.props;

    return (
      <FlatList
        data={reactedUserIds}
        keyExtractor={userId => `${userId}`}
        renderItem={({ item }) => {
          const user = allUsersById.get(item);
          if (!user) {
            return null;
          }
          return (
            <UserItem
              key={user.user_id}
              userId={user.user_id}
              fullName={user.full_name}
              avatarUrl={user.avatar_url}
              email={user.email}
              showEmail
              onPress={() => {
                this.handlePress(user.user_id);
              }}
            />
          );
        }}
      />
    );
  }
}

export default connect()(ReactionUserList);
