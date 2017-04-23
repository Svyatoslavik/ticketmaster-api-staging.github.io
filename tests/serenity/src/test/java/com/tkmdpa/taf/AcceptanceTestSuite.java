package com.tkmdpa.taf;

import net.serenitybdd.jbehave.SerenityStories;

public class AcceptanceTestSuite extends OptimizedParallelAcceptanceTestSuite {

    public AcceptanceTestSuite() {
        selectStoryFilesForRunningSuite();
    }

    public static String baseTestedUrl = new SerenityStories().getEnvironmentVariables().getProperty("webdriver.base.url");
}
