with open('src/components/AdminPanel.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to create giveaway');
        }
        setGiveawaySuccess(`🎉 Success! Giveaway account ${data.account.id} ($${data.account.challengeSize.toLocaleString()}) has been granted and activated for ${data.account.userEmail}.`);"""

replacement = """        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || 'Failed to create giveaway');
        }
        if (!data || !data.account) {
          throw new Error('Giveaway API returned a success status but did not include the active account details.');
        }
        setGiveawaySuccess(`🎉 Success! Giveaway account ${data.account.id} ($${data.account.challengeSize.toLocaleString()}) has been granted and activated for ${data.account.userEmail}.`);"""

if target in content:
    print("Found and replaced target!")
    with open('src/components/AdminPanel.tsx', 'w', encoding='utf-8') as f:
        f.write(content.replace(target, replacement))
else:
    print("Target not found. Let's find index-based replacement.")
