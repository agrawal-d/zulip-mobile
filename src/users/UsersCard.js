/* @flow strict-local */

import React, { PureComponent } from 'react';

import type { Dispatch, PresenceState, User } from '../types';
import { connect } from '../react-redux';
import { privateNarrow } from '../utils/narrow';
import UserList from './UserList';
import { getUsers, getPresence, getUsersById } from '../selectors';
import { navigateBack, doNarrow } from '../actions';

type Props = $ReadOnly<{|
  dispatch: Dispatch,
  users: User[],
  filter: string,
  presences: PresenceState,
  usersById: Map<number, User>,
|}>;

class UsersCard extends PureComponent<Props> {
  handleUserNarrow = (userId: number) => {
    const { dispatch, usersById } = this.props;
    const user = usersById.get(userId);
    if (user) {
      dispatch(navigateBack());
      dispatch(doNarrow(privateNarrow(user.email)));
    }
  };

  render() {
    const { users, filter, presences } = this.props;
    return (
      <UserList
        users={users}
        filter={filter}
        presences={presences}
        onPress={this.handleUserNarrow}
      />
    );
  }
}

export default connect(state => ({
  users: getUsers(state),
  usersById: getUsersById(state),
  presences: getPresence(state),
}))(UsersCard);
