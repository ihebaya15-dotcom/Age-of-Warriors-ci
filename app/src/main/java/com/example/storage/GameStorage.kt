package com.example.storage

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONObject

class GameStorage(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("warriors_game_prefs", Context.MODE_PRIVATE)

    fun loadGameState(): String {
        val raw = prefs.getString(KEY_GAME_STATE, null)
        if (!raw.isNullOrEmpty()) {
            return raw
        }
        // Return default starting state
        val defaultState = JSONObject().apply {
            put("coins", 50)
            put("gems", 10)
            put("currentEra", 0) // 0: Stone, 1: Bronze, 2: Iron, 3: Modern
            put("highestEraReached", 0)
            put("totalEnemiesDefeated", 0)
            put("totalBattlesPlayed", 0)
            put("foodRateLevel", 1)
            put("foodCapLevel", 1)
            put("baseHpLevel", 1)
            put("dungeonKeys", 3)
            put("totalVictories", 0)
            put("soundEnabled", true)
            put("musicEnabled", true)
            put("gameSpeed", 1.0)
        }
        return defaultState.toString()
    }

    fun saveGameState(jsonString: String): Boolean {
        return try {
            // Verify valid JSON
            JSONObject(jsonString)
            prefs.edit().putString(KEY_GAME_STATE, jsonString).apply()
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    companion object {
        private const val KEY_GAME_STATE = "warriors_state_v1"
    }
}
