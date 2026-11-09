package com.example

import androidx.test.core.app.ApplicationProvider
import com.example.storage.GameStorage
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ExampleRobolectricTest {

    @Test
    fun testAppDetails() {
        val appName = "Age of Warriors"
        assertEquals("Age of Warriors", appName)
    }

    @Test
    fun testGameStoragePersistence() {
        val context = ApplicationProvider.getApplicationContext<android.content.Context>()
        val storage = GameStorage(context)
        val defaultJson = JSONObject(storage.loadGameState())

        assertTrue(defaultJson.has("highestEraReached"))
        assertTrue(defaultJson.has("totalEnemiesDefeated"))
        assertTrue(defaultJson.has("totalBattlesPlayed"))

        defaultJson.put("highestEraReached", 2)
        defaultJson.put("totalEnemiesDefeated", 47)
        storage.saveGameState(defaultJson.toString())

        val reloaded = JSONObject(storage.loadGameState())
        assertEquals(2, reloaded.getInt("highestEraReached"))
        assertEquals(47, reloaded.getInt("totalEnemiesDefeated"))
    }
}
