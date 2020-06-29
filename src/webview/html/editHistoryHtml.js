/* @flow strict-local */
import template from './template';
import type { ThemeName, MessageSnapshot, UserOrBot, Auth } from '../../types';
import { shortTime, humanDate } from '../../utils/date';
import css from '../css/css';
import script from '../js/script';

type HtmlRender = {
  tagHtml: string,
  displayedContentHtml: string,
};

const getFlagFromSnapshot = (snapshot: MessageSnapshot, user: UserOrBot | void): HtmlRender => {
  const { prev_content, prev_topic, content_html_diff, topic, rendered_content } = snapshot;

  if (prev_content !== undefined && prev_topic === undefined && content_html_diff !== undefined) {
    // Only content edited.
    return {
      tagHtml: template`<span class="message-tag">Edited by ${
        user ? user.full_name : 'unknown user'
      }</span>`,
      displayedContentHtml: content_html_diff,
    };
  } else if (prev_content === undefined && prev_topic !== undefined) {
    // Only topic edited.
    return {
      tagHtml: template`<span class="message-tag">Edited by ${
        user ? user.full_name : 'unknown user'
      }</span>`,
      displayedContentHtml: template`Topic:
      <span class="highlight_text_inserted">${topic}</span>
      <span class="highlight_text_deleted">${prev_topic}</span>`,
    };
  } else if (prev_topic !== undefined && content_html_diff !== undefined) {
    return {
      // Both topic and content edited.
      tagHtml: template`<span class="message-tag">Edited by ${
        user ? user.full_name : 'unknown user'
      }</span>`,
      displayedContentHtml: template`Topic:
      <span class="highlight_text_inserted">${topic}</span>
      <span class="highlight_text_deleted">${prev_topic}</span>
      <br/>$!${content_html_diff}`,
    };
  } else {
    // Original message.
    return {
      tagHtml: template`<span class="message-tag">Original message</span>`,
      displayedContentHtml: rendered_content,
    };
  }
};

const renderSnapshot = (snapshot: MessageSnapshot, usersById: Map<number, UserOrBot>): string => {
  const user = usersById.get(snapshot.user_id);
  const date = new Date(snapshot.timestamp * 1000);
  const editedTime = template`${humanDate(date)} ${shortTime(date)}`;
  const { tagHtml: tag, displayedContentHtml: displayedContent } = getFlagFromSnapshot(
    snapshot,
    user,
  );

  return template`
    <div class="edit-history-block">
      <div class="static-timestamp">${editedTime}</div>
      <span class="edit-history-content">$!${displayedContent}</span>
      <div class="message-tags">$!${tag}</div>
    </div>`;
};

export default (
  editHistory: MessageSnapshot[],
  theme: ThemeName,
  usersById: Map<number, UserOrBot>,
  auth: Auth,
): string => {
  let html: string = '';
  for (const snapshot of editHistory) {
    html += renderSnapshot(snapshot, usersById);
  }

  return template`
$!${script(null, auth)}
$!${css(theme)}
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
<body style="overflow-x: hidden;">
$!${html}
</body>`;
};
