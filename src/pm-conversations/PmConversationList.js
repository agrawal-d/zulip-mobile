/* @flow strict-local */
import React, { PureComponent } from 'react';
import { FlatList, StyleSheet } from 'react-native';

import type { Dispatch, PmConversationData, UserOrBot } from '../types';
import { privateNarrow, groupNarrow } from '../utils/narrow';
import UserItem from '../users/UserItem';
import GroupPmConversationItem from './GroupPmConversationItem';
import { doNarrow } from '../actions';

const styles = StyleSheet.create({
  list: {
    flex: 1,
    flexDirection: 'column',
  },
});

type Props = $ReadOnly<{|
  dispatch: Dispatch,
  conversations: PmConversationData[],
  usersById: Map<number, UserOrBot>,
  usersByEmail: Map<string, UserOrBot>,
|}>;

/**
 * A list describing all PM conversations.
 * */
export default class PmConversationList extends PureComponent<Props> {
  handleUserNarrow = (userId: number) => {
    const { usersById } = this.props;
    const user = usersById.get(userId);
    if (user) {
      this.props.dispatch(doNarrow(privateNarrow(user.email)));
    }
  };

  handleGroupNarrow = (email: string) => {
    this.props.dispatch(doNarrow(groupNarrow(email.split(','))));
  };

  render() {
    const { conversations, usersByEmail } = this.props;

    return (
      <FlatList
        style={styles.list}
        initialNumToRender={20}
        data={conversations}
        keyExtractor={item => item.recipients}
        renderItem={({ item }) => {
          if (item.recipients.indexOf(',') === -1) {
            const user = usersByEmail.get(item.recipients);

            if (!user) {
              return null;
            }

            return (
              <UserItem
                email={user.email}
                userId={user.user_id}
                fullName={user.full_name}
                avatarUrl={user.avatar_url}
                unreadCount={item.unread}
                onPress={this.handleUserNarrow}
              />
            );
          }

          return (
            <GroupPmConversationItem
              email={item.recipients}
              unreadCount={item.unread}
              usersByEmail={usersByEmail}
              onPress={this.handleGroupNarrow}
            />
          );
        }}
      />
    );
  }
}
