/* @flow strict-local */

import React from 'react';
import { View, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import type { NavigationScreenProp } from 'react-navigation';
import type { Dispatch, Auth, ThemeName, UserOrBot } from '../types';
import SpinningProgress from '../common/SpinningProgress';
import type { MessageSnapshot } from '../api/modelTypes';
import { connect } from '../react-redux';
import { getAuth, getAllUsersById } from '../selectors';
import { Screen } from '../common';
import * as api from '../api';
import editHistoryHtml from '../webview/html/editHistoryHtml';
import getOnShouldStartLoadWithRequest, {
  assetsPath,
} from '../webview/getOnShouldStartLoadWithRequest';

type SelectorProps = {|
  auth: Auth,
  usersById: Map<number, UserOrBot>,
|};

type Props = $ReadOnly<{|
  navigation: NavigationScreenProp<{ params: {| messageId: number, theme: ThemeName |} }>,

  dispatch: Dispatch,
  ...SelectorProps,
|}>;

type State = $ReadOnly<{|
  messageHistory: MessageSnapshot[] | null,
|}>;

class EditHistory extends React.Component<Props, State> {
  state = {
    messageHistory: null,
  };

  async componentDidMount() {
    const { auth, navigation } = this.props;

    this.setState({
      messageHistory: (await api.getMessageHistory(auth, navigation.state.params.messageId))
        .message_history,
    });
  }

  render() {
    const { messageHistory } = this.state;

    if (messageHistory === null) {
      return (
        <Screen title="Edit History">
          <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <SpinningProgress color="white" size={48} />
          </View>
        </Screen>
      );
    }
    const { usersById, auth } = this.props;
    const theme = this.props.navigation.state.params.theme;
    const baseUrl = `${assetsPath}/editHistory.html`;
    const html: string = editHistoryHtml(messageHistory, theme, usersById, auth);

    return (
      <Screen title="Edit History">
        <WebView
          source={{ baseUrl, html }}
          originWhitelist={['file://']}
          style={{ backgroundColor: 'transparent' }}
          onShouldStartLoadWithRequest={getOnShouldStartLoadWithRequest(baseUrl)}
          onError={(msg: mixed) => {
            // eslint-disable-next-line no-console
            console.error(msg);
          }}
        />
      </Screen>
    );
  }
}

export default connect<SelectorProps, _, _>((state, props) => ({
  auth: getAuth(state),
  usersById: getAllUsersById(state),
}))(EditHistory);
