package com.example

import org.junit.Assert.assertEquals
import org.junit.Test

class ExampleUnitTest {
    @Test
    fun addition_isCorrect() {
        assertEquals(4, 2 + 2)
    }

    @Test
    fun testAppConfiguration() {
        val appName = "Age of Warriors"
        val maxEras = 4
        assertEquals("Age of Warriors", appName)
        assertEquals(4, maxEras)
    }
}
