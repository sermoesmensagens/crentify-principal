
import { WP_CONFIG } from '../constants';

export const postToWordPress = async (title: string, content: string) => {
  const auth = btoa(`${WP_CONFIG.username}:${WP_CONFIG.password}`);
  
  try {
    const response = await fetch(WP_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        title,
        content,
        status: 'draft' // Keep as draft for review
      })
    });
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Falha ao postar no WordPress');
    }
    
    return await response.json();
  } catch (error) {
    console.error('WordPress Error:', error);
    throw error;
  }
};
