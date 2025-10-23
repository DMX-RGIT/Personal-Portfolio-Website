// github.js - GitHub API integration
document.addEventListener('DOMContentLoaded', function() {
    const githubUsername = 'Shardul-no'; // GitHub username
    const activityContainer = document.getElementById('github-activity');
    if (!activityContainer) return;
    
    const apiUrl = `https://api.github.com/users/${githubUsername}/events?per_page=5`;

    // Format the GitHub event data into a user-friendly message
    function formatEvent(event) {
        const repoName = event.repo.name.split('/')[1];
        const repoUrl = `https://github.com/${event.repo.name}`;
        const date = new Date(event.created_at).toLocaleDateString();
        
        let message = '';
        let icon = '';
        
        switch (event.type) {
            case 'PushEvent':
                const commits = event.payload.commits;
                const commitCount = commits ? commits.length : 0;
                const commitWord = commitCount === 1 ? 'commit' : 'commits';
                message = `Pushed ${commitCount} ${commitWord} to <a href="${repoUrl}" target="_blank">${repoName}</a>`;
                icon = '💻';
                break;
            case 'CreateEvent':
                message = `Created repository <a href="${repoUrl}" target="_blank">${repoName}</a>`;
                icon = '🆕';
                break;
            case 'ForkEvent':
                const forkedRepo = event.payload.forkee.full_name;
                message = `Forked <a href="https://github.com/${forkedRepo}" target="_blank">${forkedRepo}</a> from <a href="${repoUrl}" target="_blank">${repoName}</a>`;
                icon = '🍴';
                break;
            case 'IssuesEvent':
                const issue = event.payload.issue;
                const issueAction = event.payload.action;
                message = `${issueAction} issue <a href="${issue.html_url}" target="_blank">#${issue.number}</a> in <a href="${repoUrl}" target="_blank">${repoName}</a>`;
                icon = '📝';
                break;
            case 'PullRequestEvent':
                const pr = event.payload.pull_request;
                const prAction = event.payload.action;
                message = `${prAction} pull request <a href="${pr.html_url}" target="_blank">#${pr.number}</a> in <a href="${repoUrl}" target="_blank">${repoName}</a>`;
                icon = '🔀';
                break;
            default:
                message = `Performed ${event.type} on <a href="${repoUrl}" target="_blank">${repoName}</a>`;
                icon = '📌';
        }

        return `
            <div class="activity-item">
                <div class="activity-header">
                    <span class="activity-icon">${icon}</span>
                    <span class="activity-date">${date}</span>
                </div>
                <div class="activity-message">${message}</div>
            </div>
        `;
    }

    // Show loading state
    activityContainer.innerHTML = '<div class="activity-item">Loading GitHub activity...</div>';

    // Fetch and display GitHub activity with cache busting
    const timestamp = new Date().getTime();
    fetch(`${apiUrl}&_=${timestamp}`)
        .then(response => {
            if (!response.ok) {
                if (response.status === 403) {
                    const resetTime = response.headers.get('X-RateLimit-Reset') * 1000;
                    const resetDate = new Date(resetTime).toLocaleTimeString();
                    throw new Error(`GitHub API rate limit exceeded. Resets at ${resetDate}`);
                } else if (response.status === 404) {
                    throw new Error('GitHub user not found');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(events => {
            if (!Array.isArray(events) || events.length === 0) {
                activityContainer.innerHTML = `
                    <div class="activity-item">
                        No recent activity found for ${githubUsername}.
                    </div>`;
                return;
            }

            const activityHTML = events
                .filter(event => event.type !== 'WatchEvent') // Filter out star events for cleaner feed
                .slice(0, 5) // Limit to 5 most recent events
                .map(event => formatEvent(event))
                .join('');
                
            activityContainer.innerHTML = activityHTML || `
                <div class="activity-item">
                    No recent development activity to show.
                </div>`;
        })
        .catch(error => {
            console.error('Error fetching GitHub activity:', error);
            activityContainer.innerHTML = `
                <div class="activity-item">
                    Couldn't load GitHub activity. ${error.message}
                    <br><small>Check the console for more details.</small>
                </div>`;
            
            // Add a refresh button
            const refreshButton = document.createElement('button');
            refreshButton.textContent = 'Try Again';
            refreshButton.className = 'refresh-button';
            refreshButton.onclick = () => window.location.reload();
            activityContainer.appendChild(document.createElement('br'));
            activityContainer.appendChild(refreshButton);
        });
});